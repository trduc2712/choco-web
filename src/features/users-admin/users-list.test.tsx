import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

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

const ROLES = [
  {
    id: 'role-admin',
    systemKey: 'admin',
    name: 'Administrator',
    isDefault: false,
    permissions: [],
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

function user(n: number, overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    username: `user${n}`,
    displayName: `Person ${n}`,
    createdAt: '2026-01-01T00:00:00+00:00',
    roles: [],
    isSuspended: false,
    isDeleted: false,
    ...overrides,
  }
}

// Answers like choco-api does: the slice of `total` users the page asks for,
// and the total itself. A page past the end has no items.
function serveUsers(
  total: number,
  make: (n: number, url: URL) => AdminUser = (n) => user(n),
) {
  fetchMock.mockImplementation((input) => {
    const url = new URL(String(input), 'http://localhost')
    if (url.pathname.endsWith('/admin/roles')) {
      return Promise.resolve(Response.json(ROLES))
    }
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)
    const first = (page - 1) * pageSize + 1
    const items = Array.from(
      { length: Math.max(0, Math.min(pageSize, total - first + 1)) },
      (_, index) => make(first + index, url),
    )
    return Promise.resolve(
      Response.json({ items, page, pageSize, totalCount: total }),
    )
  })
}

function problem(status: number, body: object = {}) {
  fetchMock.mockImplementation(() =>
    Promise.resolve(
      Response.json(body, {
        status,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    ),
  )
}

function userUrls() {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input), 'http://localhost'))
    .filter((url) => url.pathname.endsWith('/admin/users'))
}

function Location() {
  const { search } = useLocation()
  return <p data-testid="search">{search}</p>
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('scrollTo', vi.fn())
  granted = ['users.read-any', 'roles.read']
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

const PAGE_SIZE = 10

function renderList(url = '/admin/users') {
  const [path, query = ''] = url.split('?')
  const params = new URLSearchParams(query)
  if (!params.has('pageSize')) params.set('pageSize', String(PAGE_SIZE))

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`${path}?${params}`]}>
        <UsersList />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

test('lists the users with their roles and asks for the active ones on page 1', async () => {
  serveUsers(3, (n) =>
    user(n, {
      roles: n === 1 ? [{ id: 'role-admin', name: 'Administrator' }] : [],
    }),
  )

  renderList()

  const row = (await screen.findByText('Person 1')).closest('tr')
  expect(row).not.toBeNull()
  expect(within(row as HTMLElement).getByText('Administrator')).toBeVisible()
  expect(
    within(screen.getByText('Person 2').closest('tr') as HTMLElement).getByText(
      i18n.t('admin.users.noRoles'),
    ),
  ).toBeVisible()

  const [first] = userUrls()
  expect(first.searchParams.has('state')).toBe(false)
  expect(first.searchParams.get('page')).toBe('1')
  expect(first.searchParams.get('pageSize')).toBe(String(PAGE_SIZE))
  expect(first.searchParams.has('roleId')).toBe(false)
  expect(first.searchParams.has('q')).toBe(false)
})

test('marks deleted users and sends state=deleted from the URL', async () => {
  serveUsers(2, (n, url) =>
    user(n, { isDeleted: url.searchParams.get('state') === 'deleted' }),
  )

  renderList('/admin/users?state=deleted')

  const row = (await screen.findByText('Person 1')).closest('tr')
  expect(
    within(row as HTMLElement).getByText(i18n.t('admin.users.states.deleted')),
  ).toBeVisible()
  expect(userUrls()[0].searchParams.get('state')).toBe('deleted')
})

test('marks suspended users with a badge, and deleted ones with another', async () => {
  serveUsers(3, (n) => user(n, { isSuspended: n !== 3, isDeleted: n === 2 }))

  renderList()

  const rowOf = async (name: string) =>
    within((await screen.findByText(name)).closest('tr') as HTMLElement)
  const suspended = i18n.t('admin.users.states.suspended')
  const deleted = i18n.t('admin.users.states.deleted')
  const active = i18n.t('admin.users.states.active')

  const first = await rowOf('Person 1')
  expect(first.getByText(suspended)).toBeVisible()
  expect(first.queryByText(deleted)).toBeNull()
  expect(first.queryByText(active)).toBeNull()
  const second = await rowOf('Person 2')
  expect(second.getByText(suspended)).toBeVisible()
  expect(second.getByText(deleted)).toBeVisible()
  const third = await rowOf('Person 3')
  expect(third.getByText(active)).toBeVisible()
  expect(third.queryByText(suspended)).toBeNull()
})

test.each(['active', 'suspended', 'deleted'])(
  'sends state=%s from the URL',
  async (state) => {
    serveUsers(2)

    renderList(`/admin/users?state=${state}`)

    await screen.findByText('Person 1')
    expect(userUrls()[0].searchParams.get('state')).toBe(state)
  },
)

test('offers all, active, suspended and deleted, and leaves state out for all', async () => {
  serveUsers(2)

  renderList('/admin/users?state=suspended')
  await screen.findByText('Person 1')

  await userEvent.click(
    screen.getByRole('combobox', { name: i18n.t('admin.users.columns.state') }),
  )
  for (const state of ['active', 'suspended', 'deleted'] as const) {
    expect(
      screen.getByRole('option', {
        name: i18n.t(`admin.users.states.${state}`),
      }),
    ).toBeVisible()
  }
  await userEvent.click(
    screen.getByRole('option', { name: i18n.t('table.filterAll') }),
  )

  await waitFor(() =>
    expect(userUrls().at(-1)?.searchParams.has('state')).toBe(false),
  )
  expect(screen.getByTestId('search')).not.toHaveTextContent('state=')
})

test('the state filter writes the URL, drops the default, and returns to page 1', async () => {
  serveUsers(24)

  renderList('/admin/users?page=2')
  await screen.findByText('Person 11')

  await userEvent.click(
    screen.getByRole('combobox', { name: i18n.t('admin.users.columns.state') }),
  )
  await userEvent.click(
    screen.getByRole('option', {
      name: i18n.t('admin.users.states.deleted'),
    }),
  )

  await waitFor(() => {
    const last = userUrls().at(-1)
    expect(last?.searchParams.get('state')).toBe('deleted')
    expect(last?.searchParams.get('page')).toBe('1')
  })
  expect(screen.getByTestId('search')).toHaveTextContent('state=deleted')
  expect(screen.getByTestId('search')).not.toHaveTextContent('page=')
})

test('the role filter offers the roles and sends roleId', async () => {
  serveUsers(24)

  renderList()
  await screen.findByText('Person 1')

  await userEvent.click(
    screen.getByRole('combobox', { name: i18n.t('admin.users.columns.roles') }),
  )
  await userEvent.click(screen.getByRole('option', { name: 'Administrator' }))

  await waitFor(() =>
    expect(userUrls().at(-1)?.searchParams.get('roleId')).toBe('role-admin'),
  )
  expect(screen.getByTestId('search')).toHaveTextContent('roleId=role-admin')
})

test('hides the role filter, and never asks for roles, without roles.read', async () => {
  granted = ['users.read-any']
  serveUsers(3)

  renderList()
  await screen.findByText('Person 1')

  expect(
    screen.queryByRole('combobox', {
      name: i18n.t('admin.users.columns.roles'),
    }),
  ).not.toBeInTheDocument()
  expect(
    fetchMock.mock.calls.some(([input]) => String(input).includes('/roles')),
  ).toBe(false)
})

test('sends the search as q and goes back to page 1', async () => {
  serveUsers(24)

  renderList('/admin/users?page=2')
  await screen.findByText('Person 11')

  await userEvent.type(
    screen.getByRole('searchbox', { name: i18n.t('admin.users.columns.user') }),
    'ada lov',
  )

  await waitFor(() => {
    const last = userUrls().at(-1)
    expect(last?.searchParams.get('q')).toBe('ada lov')
    expect(last?.searchParams.get('page')).toBe('1')
  })
})

test('ignores a blank q in the URL', async () => {
  serveUsers(3)

  renderList('/admin/users?q=%20%20')
  await screen.findByText('Person 1')

  expect(userUrls()[0].searchParams.has('q')).toBe(false)
})

test('builds the page buttons and the range from totalCount', async () => {
  serveUsers(24)

  renderList('/admin/users?page=2')

  expect(await screen.findByText('Person 11')).toBeInTheDocument()
  expect(
    screen.getByText(
      i18n.t('admin.pager.range', { from: 11, to: 20, total: 24 }),
    ),
  ).toBeInTheDocument()

  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('pagination.page', { page: 3 }),
    }),
  )

  expect(await screen.findByText('Person 21')).toBeInTheDocument()
  expect(screen.queryByText('Person 25')).not.toBeInTheDocument()
  expect(screen.getByTestId('search')).toHaveTextContent('page=3')
})

test('steps back to the last page when the page is past the end', async () => {
  serveUsers(24)

  renderList('/admin/users?page=9')

  expect(await screen.findByText('Person 21')).toBeInTheDocument()
  expect(screen.getByTestId('search')).toHaveTextContent('page=3')
  expect(userUrls()[0].searchParams.get('page')).toBe('9')
})

test('shows the empty state when nothing matches', async () => {
  serveUsers(0)

  renderList('/admin/users?q=nobody')

  expect(
    await screen.findByText(i18n.t('admin.users.empty')),
  ).toBeInTheDocument()
  expect(
    screen.getByText(i18n.t('admin.users.emptyFiltered')),
  ).toBeInTheDocument()
})

test('says so on a 403 and asks for the permissions again', async () => {
  problem(403, { code: 'Permission.Denied' })

  renderList()

  expect(
    await screen.findByText(i18n.t('admin.listError.forbidden')),
  ).toBeVisible()
  await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalled())
})

test('names the fields of a 400', async () => {
  problem(400, {
    errors: { roleId: ['bad'], pageSize: ['too big'] },
    errorCodes: {
      roleId: ['User.RoleId.Invalid'],
      pageSize: ['Page.PageSize.OutOfRange'],
    },
  })

  renderList()

  expect(
    await screen.findByText(i18n.t('admin.listError.invalidQuery')),
  ).toBeVisible()
  // The toolbar has a "Roles" label of its own; look in the alert.
  const alert = screen.getByRole('alert')
  expect(within(alert).getByText(/Role/)).toBeVisible()
  expect(within(alert).getByText(/Page size/)).toBeVisible()
})

test('opens a deleted user and links their open reports without losing the list filters', async () => {
  granted.push('reports.handle')
  const account = user(1, { isDeleted: true, isSuspended: true })
  serveUsers(1, () => account)
  const listResponse = fetchMock.getMockImplementation()
  fetchMock.mockImplementation((input, init) => {
    if (String(input).endsWith(`/admin/users/${account.id}`)) {
      return Promise.resolve(
        Response.json({
          ...account,
          bio: null,
          avatarUrl: null,
          deletedAt: '2026-01-03T00:00:00Z',
          suspension: {
            reason: 'Repeated spam',
            suspendedAt: '2026-01-02T00:00:00Z',
            suspendedBy: { id: 'moderator', username: 'moderator' },
          },
          openReportCount: 3,
        }),
      )
    }
    return listResponse!(input, init)
  })

  renderList('/admin/users?state=deleted')
  await userEvent.click(
    await screen.findByRole('button', { name: 'View details for @user1' }),
  )

  const dialog = screen.getByRole('dialog', { name: 'User details' })
  // The open user is in the URL, so the drawer can be linked to.
  expect(screen.getByTestId('search')).toHaveTextContent(`user=${account.id}`)
  expect(await within(dialog).findByText('Repeated spam')).toBeVisible()
  expect(within(dialog).getByText('Deleted on')).toBeVisible()
  expect(
    within(dialog).getByRole('link', { name: '3 open reports' }),
  ).toHaveAttribute(
    'href',
    `/admin/reports?view=all&targetType=User&targetId=${account.id}&status=Open`,
  )
  await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByTestId('search')).toHaveTextContent('state=deleted')
  expect(screen.getByTestId('search')).not.toHaveTextContent('user=')
})

test('opens the drawer of the user in the URL, even one that is not on the page', async () => {
  granted.push('reports.handle')
  const account = user(99)
  serveUsers(2)
  const listResponse = fetchMock.getMockImplementation()
  fetchMock.mockImplementation((input, init) => {
    if (String(input).endsWith(`/admin/users/${account.id}`)) {
      return Promise.resolve(
        Response.json({
          ...account,
          bio: 'Likes chocolate',
          avatarUrl: null,
          deletedAt: null,
          suspension: null,
          openReportCount: 0,
        }),
      )
    }
    return listResponse!(input, init)
  })

  renderList(`/admin/users?user=${account.id}`)

  const dialog = await screen.findByRole('dialog', { name: 'User details' })
  expect(await within(dialog).findByText('Likes chocolate')).toBeVisible()
  expect(within(dialog).getByText('@user99')).toBeVisible()
})
