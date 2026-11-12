import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import type * as CurrentUser from '@/features/current-user'
import { i18n } from '@/i18n/i18n'

import type { AdminUser } from './users-admin-api'
import { UsersList } from './users-list'

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
    useMyId: () => ME,
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

const ME = 'me-id'
const OTHER = 'other-id'

const ROLES = [
  {
    id: 'role-admin',
    systemKey: 'admin',
    name: 'Administrator',
    isDefault: false,
    permissions: ['users.suspend', 'roles.assign'],
  },
  {
    id: 'role-member',
    systemKey: 'member',
    name: 'Member',
    isDefault: true,
    permissions: [],
  },
]

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient
let users: AdminUser[]

function user(id: string, n: number, roles: AdminUser['roles'] = []) {
  return {
    id,
    username: `user${n}`,
    displayName: `Person ${n}`,
    createdAt: '2026-01-01T00:00:00+00:00',
    roles,
    isSuspended: false,
    isDeleted: false,
  }
}

function problem(status: number, body: object = {}) {
  return Promise.resolve(
    Response.json(body, {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    }),
  )
}

// What the suspension endpoint answers; 204 unless a test replaces it.
let suspensionAnswer: () => Promise<Response>

function serve() {
  fetchMock.mockImplementation((input) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname.endsWith('/suspension')) return suspensionAnswer()
    if (url.pathname.endsWith('/admin/roles')) {
      return Promise.resolve(Response.json(ROLES))
    }
    return Promise.resolve(
      Response.json({
        items: users,
        page: 1,
        pageSize: 10,
        totalCount: users.length,
      }),
    )
  })
}

function suspensionCalls() {
  return fetchMock.mock.calls.filter(([input]) =>
    String(input).endsWith('/suspension'),
  )
}

function listCalls() {
  return fetchMock.mock.calls.filter(([input]) =>
    new URL(String(input), 'http://localhost').pathname.endsWith(
      '/admin/users',
    ),
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  refreshCurrentUser.mockClear()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
  granted = ['users.read-any', 'roles.read', 'users.suspend', 'roles.assign']
  users = [user(ME, 1), user(OTHER, 2)]
  suspensionAnswer = () => Promise.resolve(new Response(null, { status: 204 }))
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  serve()
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function renderList() {
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/admin/users?pageSize=10']}>
          <UsersList />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const text = (key: string, options?: object) =>
  String(i18n.t(key as never, options as never))

async function openMenu(name = 'Person 2') {
  const trigger = await screen.findByRole('button', {
    name: text('admin.users.suspension.menuLabel', { name }),
  })
  await userEvent.click(trigger)
}

async function openSuspendDialog() {
  await openMenu()
  await userEvent.click(
    await screen.findByRole('menuitem', {
      name: text('admin.users.suspension.suspend'),
    }),
  )
  return screen.findByLabelText(
    new RegExp(text('admin.users.suspension.reason')),
  )
}

async function continueToConfirm(reason: string) {
  const field = await openSuspendDialog()
  await userEvent.click(field)
  await userEvent.paste(reason)
  await userEvent.click(
    screen.getByRole('button', {
      name: text('admin.users.suspension.continue'),
    }),
  )
}

async function confirmSuspend() {
  await userEvent.click(
    await screen.findByRole('button', {
      name: text('admin.users.suspension.confirmSuspend'),
    }),
  )
}

test('shows no suspension actions without users.suspend', async () => {
  granted = ['users.read-any']

  renderList()

  expect(await screen.findByText('Person 2')).toBeVisible()
  expect(
    screen.queryByRole('columnheader', {
      name: text('admin.users.columns.actions'),
    }),
  ).toBeNull()
  expect(screen.queryByRole('button', { name: /Actions for/ })).toBeNull()
})

test('offers the actions on other rows and none on the own row', async () => {
  renderList()

  expect(
    await screen.findByRole('button', { name: 'Actions for Person 2' }),
  ).toBeVisible()
  expect(
    screen.queryByRole('button', { name: 'Actions for Person 1' }),
  ).toBeNull()
})

test('disables Suspend when the target holds a permission the viewer lacks', async () => {
  granted = ['users.read-any', 'roles.read', 'users.suspend']
  users = [
    user(ME, 1),
    user(OTHER, 2, [{ id: 'role-admin', name: 'Administrator' }]),
  ]

  renderList()
  await openMenu()

  expect(
    await screen.findByRole('menuitem', {
      name: text('admin.users.suspension.suspend'),
    }),
  ).toHaveAttribute('aria-disabled', 'true')
})

test('asks for a reason before the confirmation step', async () => {
  renderList()
  await openSuspendDialog()

  await userEvent.click(
    screen.getByRole('button', {
      name: text('admin.users.suspension.continue'),
    }),
  )

  expect(
    await screen.findByText(text('admin.users.suspension.reasonRequired')),
  ).toBeVisible()
  expect(suspensionCalls()).toHaveLength(0)
})

test('counts the trimmed reason and refuses more than 150 characters', async () => {
  renderList()
  const field = await openSuspendDialog()
  await userEvent.click(field)
  await userEvent.paste(`  ${'a'.repeat(151)}  `)

  expect(
    await screen.findByText(
      text('admin.users.suspension.reasonTooLong', { max: 150 }),
    ),
  ).toBeVisible()
  expect(screen.getByText('151 / 150')).toBeVisible()

  await userEvent.click(
    screen.getByRole('button', {
      name: text('admin.users.suspension.continue'),
    }),
  )
  expect(
    screen.queryByRole('button', {
      name: text('admin.users.suspension.confirmSuspend'),
    }),
  ).toBeNull()
})

test('suspends with the trimmed reason after confirming and refreshes the list', async () => {
  renderList()
  await screen.findByText('Person 2')
  const before = listCalls().length

  await continueToConfirm('  Repeated spam  ')
  expect(screen.getByText('Repeated spam')).toBeVisible()
  await confirmSuspend()

  await waitFor(() => expect(suspensionCalls()).toHaveLength(1))
  const [input, init] = suspensionCalls()[0]
  expect(String(input)).toContain(`/admin/users/${OTHER}/suspension`)
  expect(init?.method).toBe('PUT')
  expect(JSON.parse(String(init?.body))).toEqual({ reason: 'Repeated spam' })
  await waitFor(() => expect(listCalls().length).toBeGreaterThan(before))
})

test('lifts a suspension after confirming and refreshes the list', async () => {
  users = [user(ME, 1), { ...user(OTHER, 2), isSuspended: true }]
  renderList()
  await screen.findByText('Person 2')
  const before = listCalls().length

  await openMenu()
  await userEvent.click(
    await screen.findByRole('menuitem', {
      name: text('admin.users.suspension.lift'),
    }),
  )
  expect(suspensionCalls()).toHaveLength(0)
  await userEvent.click(
    await screen.findByRole('button', {
      name: text('admin.users.suspension.confirmLift'),
    }),
  )

  await waitFor(() => expect(suspensionCalls()).toHaveLength(1))
  const [input, init] = suspensionCalls()[0]
  expect(String(input)).toContain(`/admin/users/${OTHER}/suspension`)
  expect(init?.method).toBe('DELETE')
  await waitFor(() => expect(listCalls().length).toBeGreaterThan(before))
})

test('shows the reason error of a 400 on the field', async () => {
  suspensionAnswer = () =>
    problem(400, {
      errors: { reason: ['too long'] },
      errorCodes: { reason: ['User.SuspensionReason.TooLong'] },
    })
  renderList()

  await continueToConfirm('Spam')
  await confirmSuspend()

  expect(
    await screen.findByText(text('apiErrors.reasons.TooLong')),
  ).toBeVisible()
})

test.each([
  [
    400,
    'User.CannotSuspendSelf',
    'admin.users.suspension.errors.User.CannotSuspendSelf',
  ],
  [403, 'Permission.Denied', 'admin.users.suspension.errors.Permission.Denied'],
  [404, 'User.NotFound', 'admin.users.suspension.errors.User.NotFound'],
  [
    409,
    'User.LastAdministrator',
    'admin.users.suspension.errors.User.LastAdministrator',
  ],
])('explains %i %s when suspending', async (status, code, key) => {
  suspensionAnswer = () => problem(status, { code })
  renderList()

  await continueToConfirm('Spam')
  await confirmSuspend()

  expect(await screen.findByText(text(key))).toBeVisible()
  if (status === 403) {
    await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalled())
  }
})

test.each([
  [
    400,
    'User.CannotSuspendSelf',
    'admin.users.suspension.errors.User.CannotSuspendSelf',
  ],
  [403, 'Permission.Denied', 'admin.users.suspension.errors.Permission.Denied'],
  [404, 'User.NotFound', 'admin.users.suspension.errors.User.NotFound'],
])('explains %i %s when lifting', async (status, code, key) => {
  users = [user(ME, 1), { ...user(OTHER, 2), isSuspended: true }]
  suspensionAnswer = () => problem(status, { code })
  renderList()

  await openMenu()
  await userEvent.click(
    await screen.findByRole('menuitem', {
      name: text('admin.users.suspension.lift'),
    }),
  )
  await userEvent.click(
    await screen.findByRole('button', {
      name: text('admin.users.suspension.confirmLift'),
    }),
  )

  expect(await screen.findByText(text(key))).toBeVisible()
})

test('explains that another administrator must stay active', () => {
  expect(text('admin.users.suspension.errors.User.LastAdministrator')).toMatch(
    /another administrator/i,
  )
})

test('offers only Suspend on a user who is not suspended', async () => {
  renderList()
  await openMenu()

  expect(
    await screen.findByRole('menuitem', {
      name: text('admin.users.suspension.suspend'),
    }),
  ).toBeVisible()
  expect(
    screen.queryByRole('menuitem', {
      name: text('admin.users.suspension.lift'),
    }),
  ).toBeNull()
})

test('offers only Lift suspension on a suspended user', async () => {
  users = [user(ME, 1), { ...user(OTHER, 2), isSuspended: true }]
  renderList()
  await openMenu()

  expect(
    await screen.findByRole('menuitem', {
      name: text('admin.users.suspension.lift'),
    }),
  ).toBeVisible()
  expect(
    screen.queryByRole('menuitem', {
      name: text('admin.users.suspension.suspend'),
    }),
  ).toBeNull()
})

test('hides the actions on the own row even when suspended', async () => {
  users = [{ ...user(ME, 1), isSuspended: true }, user(OTHER, 2)]
  renderList()

  await screen.findByRole('button', { name: 'Actions for Person 2' })
  expect(
    screen.queryByRole('button', { name: 'Actions for Person 1' }),
  ).toBeNull()
})
