import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import type * as CurrentUser from '@/features/current-user'
import { i18n } from '@/i18n/i18n'

import { RoleHolders } from './role-holders'

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

vi.mock('@/features/current-user', async (importOriginal) => {
  const original = await importOriginal<typeof CurrentUser>()
  return {
    ...original,
    useRefreshCurrentUser: () => vi.fn(() => Promise.resolve()),
    usePermissions: () => ({
      isLoading: false,
      granted,
      can: (permission: string) => granted.includes(permission),
      canAny: () => false,
    }),
  }
})

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient

function holder(n: number) {
  return {
    id: `h${n}`,
    username: `holder${n}`,
    displayName: `Holder ${n}`,
    createdAt: '2026-01-01T00:00:00+00:00',
    roles: [{ id: 'role-admin', name: 'Administrator' }],
    isDeleted: false,
  }
}

function serveHolders(total: number) {
  fetchMock.mockImplementation((input) => {
    const url = new URL(String(input), 'http://localhost')
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)
    const first = (page - 1) * pageSize + 1
    const items = Array.from(
      { length: Math.max(0, Math.min(pageSize, total - first + 1)) },
      (_, index) => holder(first + index),
    )
    return Promise.resolve(
      Response.json({ items, page, pageSize, totalCount: total }),
    )
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function renderHolders() {
  render(
    <QueryClientProvider client={client}>
      <RoleHolders roleId="role-admin" />
    </QueryClientProvider>,
  )
}

test('lists the holders of the role, filtered by roleId, with the total', async () => {
  granted = ['users.read-any']
  serveHolders(12)

  renderHolders()

  expect(await screen.findByText('Holder 1')).toBeVisible()
  expect(screen.getByText('Holder 10')).toBeVisible()
  expect(screen.queryByText('Holder 11')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /\(12\)/ })).toBeInTheDocument()

  const url = new URL(String(fetchMock.mock.calls[0][0]), 'http://localhost')
  expect(url.searchParams.get('roleId')).toBe('role-admin')
  expect(url.searchParams.get('state')).toBe('active')
})

test('turns the page of holders', async () => {
  granted = ['users.read-any']
  serveHolders(12)

  renderHolders()
  await screen.findByText('Holder 1')

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('admin.users.holders.next') }),
  )

  expect(await screen.findByText('Holder 11')).toBeVisible()
  expect(screen.queryByText('Holder 1')).not.toBeInTheDocument()
})

test('says nobody holds the role when the list is empty', async () => {
  granted = ['users.read-any']
  serveHolders(0)

  renderHolders()

  expect(
    await screen.findByText(i18n.t('admin.users.holders.empty')),
  ).toBeVisible()
})

test('shows nothing, and asks nothing, without users.read-any', () => {
  granted = ['roles.read']

  renderHolders()

  expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})
