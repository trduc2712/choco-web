import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import type * as CurrentUser from '@/features/current-user'
import { i18n } from '@/i18n/i18n'

import type { Role } from './roles-api'
import { NewRoleButton, RolesScreen } from './roles-screen'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-admin',
    sessionId: 'session',
    getToken: () => Promise.resolve('token'),
  }),
}))

let granted: string[] = []
const refreshCurrentUser = vi.fn(() => Promise.resolve())

vi.mock('@/features/current-user', async (importOriginal) => {
  const original = await importOriginal<typeof CurrentUser>()
  return {
    ...original,
    useRefreshCurrentUser: () => refreshCurrentUser,
    usePermissions: () => ({
      isLoading: false,
      granted,
      can: (permission: string) => granted.includes(permission),
      canAny: (list: readonly string[]) =>
        list.some((permission) => granted.includes(permission)),
    }),
  }
})

const MODERATOR: Role = {
  id: 'role-moderator',
  systemKey: null,
  name: 'Moderator',
  isDefault: false,
  permissions: ['posts.delete-any', 'reports.handle'],
}
const MEMBER: Role = {
  id: 'role-member',
  systemKey: 'member',
  name: 'Member',
  isDefault: true,
  permissions: [],
}
const ADMIN: Role = {
  id: 'role-admin',
  systemKey: 'admin',
  name: 'Admin',
  isDefault: false,
  permissions: ['audit-log.read', 'roles.read'],
}
const CATALOG = [
  'roles.read',
  'roles.update',
  'roles.delete',
  'roles.create',
  'posts.delete-any',
  'reports.handle',
  'audit-log.read',
].map((code) => ({ code }))

const FULL = [
  'roles.read',
  'roles.create',
  'roles.update',
  'roles.delete',
  'posts.delete-any',
  'reports.handle',
  'audit-log.read',
]

type Handler = (body: unknown) => Response | Promise<Response>

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient
let handlers: Record<string, Handler>

function problem(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status })
}

// Answers like choco-api: by "METHOD /path", the roles and the catalog unless
// a test replaces one.
beforeEach(() => {
  granted = FULL
  refreshCurrentUser.mockClear()
  handlers = {
    'GET /admin/roles': () => Response.json([ADMIN, MEMBER, MODERATOR]),
    [`GET /admin/roles/${ADMIN.id}`]: () => Response.json(ADMIN),
    [`GET /admin/roles/${MEMBER.id}`]: () => Response.json(MEMBER),
    [`GET /admin/roles/${MODERATOR.id}`]: () => Response.json(MODERATOR),
    'GET /admin/roles/gone': () => new Response(null, { status: 404 }),
    'GET /admin/permissions': () => Response.json(CATALOG),
  }
  fetchMock.mockReset()
  fetchMock.mockImplementation((input, init) => {
    const url = new URL(String(input), 'http://localhost')
    const path = url.pathname.replace(/^.*\/api\/v1/, '')
    const key = `${init?.method ?? 'GET'} ${path}`
    const handler = handlers[key]
    if (!handler) throw new Error(`unexpected request: ${key}`)
    const body: unknown = init?.body ? JSON.parse(String(init.body)) : undefined
    return Promise.resolve(handler(body))
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false
  }
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function renderRoles(entry = '/admin/roles') {
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[entry]}>
          <NewRoleButton />
          <RolesScreen />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

function calls(key: string) {
  return fetchMock.mock.calls.filter(
    ([input, init]) =>
      `${init?.method ?? 'GET'} ${new URL(String(input), 'http://localhost').pathname.replace(/^.*\/api\/v1/, '')}` ===
      key,
  )
}

const text = (key: string, options?: Record<string, unknown>): string =>
  String(i18n.t(key as never, options as never))

async function openRole(name: string) {
  await userEvent.click(await screen.findByRole('button', { name }))
}

test('lists the roles with their kind and permission count', async () => {
  renderRoles()

  expect(await screen.findByText('Moderator')).toBeInTheDocument()
  expect(screen.getByText('Member')).toBeInTheDocument()
  expect(screen.getByText(text('admin.roles.badges.default'))).toBeVisible()
  expect(screen.getAllByText(text('admin.roles.badges.system'))).toHaveLength(2)
})

test('shows "New role" only to someone who may create roles', async () => {
  renderRoles()
  expect(
    await screen.findByRole('button', { name: text('admin.roles.new') }),
  ).toBeInTheDocument()
})

test('hides "New role" without roles.create', async () => {
  granted = ['roles.read']
  renderRoles()

  await screen.findByText('Moderator')
  expect(
    screen.queryByRole('button', { name: text('admin.roles.new') }),
  ).not.toBeInTheDocument()
})

test('hides edit and delete from someone who only reads roles', async () => {
  granted = ['roles.read']
  renderRoles()

  await openRole('Moderator')

  expect(await screen.findByText('Delete any post')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: text('admin.roles.edit') }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: text('admin.roles.delete') }),
  ).not.toBeInTheDocument()
})

test('disables edit and delete, with a reason, when the role has a permission the viewer lacks', async () => {
  granted = ['roles.read', 'roles.update', 'roles.delete', 'reports.handle']
  renderRoles()

  await openRole('Moderator')

  expect(
    await screen.findByRole('button', { name: text('admin.roles.edit') }),
  ).toBeDisabled()
  expect(
    screen.getByRole('button', { name: text('admin.roles.delete') }),
  ).toBeDisabled()
})

test('hides delete for the default role and for a system role, and keeps edit', async () => {
  renderRoles()

  await openRole('Member')
  expect(
    await screen.findByRole('button', { name: text('admin.roles.edit') }),
  ).toBeEnabled()
  expect(
    screen.queryByRole('button', { name: text('admin.roles.delete') }),
  ).not.toBeInTheDocument()
})

test('shows a permission code the app does not know as itself', async () => {
  handlers['GET /admin/roles/role-moderator'] = () =>
    Response.json({ ...MODERATOR, permissions: ['users.ban'] })
  renderRoles()

  await openRole('Moderator')

  expect((await screen.findAllByText('users.ban')).length).toBeGreaterThan(0)
})

test('offers only the permissions the viewer holds when creating', async () => {
  granted = ['roles.read', 'roles.create', 'reports.handle']
  renderRoles('/admin/roles?role=new')

  expect(
    await screen.findByRole('checkbox', { name: /Handle reports/ }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('checkbox', { name: /Read the audit log/ }),
  ).not.toBeInTheDocument()
})

test('creates a role with the trimmed name and the chosen permissions', async () => {
  handlers['POST /admin/roles'] = (body) =>
    Response.json(
      { ...MODERATOR, id: 'new', ...(body as object) },
      { status: 201 },
    )
  renderRoles('/admin/roles?role=new')

  await userEvent.type(await screen.findByLabelText(/Name/), '  Helper  ')
  await userEvent.click(
    await screen.findByRole('checkbox', { name: /Handle reports/ }),
  )
  await userEvent.click(
    screen.getByRole('button', { name: text('admin.roles.save') }),
  )

  await waitFor(() => expect(calls('POST /admin/roles')).toHaveLength(1))
  expect(JSON.parse(String(calls('POST /admin/roles')[0][1]?.body))).toEqual({
    name: 'Helper',
    permissions: ['reports.handle'],
  })
})

test('does not send an empty name or one over 64 characters', async () => {
  renderRoles('/admin/roles?role=new')
  const name = await screen.findByLabelText(/Name/)
  const save = screen.getByRole('button', { name: text('admin.roles.save') })

  await userEvent.click(save)
  expect(
    await screen.findByText(text('admin.roles.form.nameRequired')),
  ).toBeVisible()

  await userEvent.type(name, 'x'.repeat(65))
  await userEvent.click(save)
  expect(
    await screen.findByText(text('admin.roles.form.nameTooLong', { max: 64 })),
  ).toBeVisible()
  expect(calls('POST /admin/roles')).toHaveLength(0)
})

test('shows Role.NameTaken on the name field', async () => {
  handlers['POST /admin/roles'] = () =>
    problem(409, { code: 'Role.NameTaken', status: 409 })
  renderRoles('/admin/roles?role=new')

  await userEvent.type(await screen.findByLabelText(/Name/), 'Moderator')
  await userEvent.click(
    screen.getByRole('button', { name: text('admin.roles.save') }),
  )

  expect(
    await screen.findByText('Another role already has this name.'),
  ).toBeVisible()
})

test('shows the field errors of a 400 on name and on permissions', async () => {
  handlers['POST /admin/roles'] = () =>
    problem(400, {
      status: 400,
      errors: { name: ['too long'], permissions: ['unknown'] },
      errorCodes: {
        name: ['Role.Name.TooLong'],
        permissions: ['Role.Permissions.UnknownPermission'],
      },
    })
  renderRoles('/admin/roles?role=new')

  await userEvent.type(await screen.findByLabelText(/Name/), 'Helper')
  await userEvent.click(
    screen.getByRole('button', { name: text('admin.roles.save') }),
  )

  expect(await screen.findByText('This is too long.')).toBeVisible()
  expect(
    await screen.findByText("This value isn't a known permission."),
  ).toBeVisible()
})

test('asks before changing the default role, then saves and refreshes /me', async () => {
  handlers['PUT /admin/roles/role-member'] = (body) =>
    Response.json({ ...MEMBER, ...(body as object) })
  renderRoles()

  await openRole('Member')
  await userEvent.click(
    await screen.findByRole('button', { name: text('admin.roles.edit') }),
  )
  await userEvent.click(
    await screen.findByRole('checkbox', { name: /Handle reports/ }),
  )
  await userEvent.click(
    screen.getByRole('button', { name: text('admin.roles.save') }),
  )

  expect(
    await screen.findByText(text('admin.roles.defaultConfirmDescription')),
  ).toBeVisible()
  expect(calls('PUT /admin/roles/role-member')).toHaveLength(0)

  await userEvent.click(
    screen.getByRole('button', { name: text('admin.roles.confirmSave') }),
  )

  await waitFor(() =>
    expect(calls('PUT /admin/roles/role-member')).toHaveLength(1),
  )
  expect(
    JSON.parse(String(calls('PUT /admin/roles/role-member')[0][1]?.body)),
  ).toEqual({ name: 'Member', permissions: ['reports.handle'] })
  await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalled())
})

test('updating an ordinary role needs no confirmation', async () => {
  handlers['PUT /admin/roles/role-moderator'] = (body) =>
    Response.json({ ...MODERATOR, ...(body as object) })
  renderRoles()

  await openRole('Moderator')
  await userEvent.click(
    await screen.findByRole('button', { name: text('admin.roles.edit') }),
  )
  await userEvent.click(
    await screen.findByRole('button', { name: text('admin.roles.save') }),
  )

  await waitFor(() =>
    expect(calls('PUT /admin/roles/role-moderator')).toHaveLength(1),
  )
  expect(
    screen.queryByText(text('admin.roles.defaultConfirmDescription')),
  ).not.toBeInTheDocument()
})

test('explains Role.HeldByCaller when saving a role the viewer holds', async () => {
  handlers['PUT /admin/roles/role-moderator'] = () =>
    problem(403, { code: 'Role.HeldByCaller', status: 403 })
  renderRoles()

  await openRole('Moderator')
  await userEvent.click(
    await screen.findByRole('button', { name: text('admin.roles.edit') }),
  )
  await userEvent.click(
    await screen.findByRole('button', { name: text('admin.roles.save') }),
  )

  expect(
    await screen.findByText(
      "You hold this role, so you can't change or delete it.",
    ),
  ).toBeVisible()
})

test('asks again for /me when the API denies a permission', async () => {
  handlers['PUT /admin/roles/role-moderator'] = () =>
    problem(403, { code: 'Permission.Denied', status: 403 })
  renderRoles()

  await openRole('Moderator')
  await userEvent.click(
    await screen.findByRole('button', { name: text('admin.roles.edit') }),
  )
  await userEvent.click(
    await screen.findByRole('button', { name: text('admin.roles.save') }),
  )

  await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalled())
  expect(
    await screen.findByText(/You don't have permission to do that/),
  ).toBeVisible()
})

test('asks again for /me when the list is denied', async () => {
  handlers['GET /admin/roles'] = () =>
    problem(403, { code: 'Permission.Denied', status: 403 })
  renderRoles()

  expect(await screen.findByText(text('admin.roles.loadError'))).toBeVisible()
  await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalled())
})

test('deletes a role after a confirmation that says what is lost', async () => {
  handlers['DELETE /admin/roles/role-moderator'] = () =>
    new Response(null, { status: 204 })
  renderRoles()

  await openRole('Moderator')
  await userEvent.click(
    await screen.findByRole('button', { name: text('admin.roles.delete') }),
  )
  expect(
    await screen.findByText(text('admin.roles.deleteDescription')),
  ).toBeVisible()
  expect(calls('DELETE /admin/roles/role-moderator')).toHaveLength(0)

  await userEvent.click(
    screen.getByRole('button', { name: text('admin.roles.confirmDelete') }),
  )

  await waitFor(() =>
    expect(calls('DELETE /admin/roles/role-moderator')).toHaveLength(1),
  )
  await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalled())
})

test.each([
  ['Role.NotFound', 404, 'This role no longer exists.'],
  ['Role.SystemNotDeletable', 409, "System roles can't be deleted."],
  ['Role.DefaultNotDeletable', 409, "The default role can't be deleted."],
  [
    'Role.HeldByCaller',
    403,
    "You hold this role, so you can't change or delete it.",
  ],
])('explains %s when a delete is refused', async (code, status, message) => {
  handlers['DELETE /admin/roles/role-moderator'] = () =>
    problem(status, { code, status })
  renderRoles()

  await openRole('Moderator')
  await userEvent.click(
    await screen.findByRole('button', { name: text('admin.roles.delete') }),
  )
  await userEvent.click(
    await screen.findByRole('button', {
      name: text('admin.roles.confirmDelete'),
    }),
  )

  expect(await screen.findByText(message)).toBeVisible()
})

test('says so when the open role no longer exists', async () => {
  renderRoles('/admin/roles?role=gone')

  expect(await screen.findByText(text('admin.roles.notFound'))).toBeVisible()
})
