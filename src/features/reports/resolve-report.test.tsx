import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import type * as CurrentUser from '@/features/current-user'
import { i18n } from '@/i18n/i18n'

import { availableOutcomes } from './report-rules'
import type { ReportTargetType } from './reports-api'
import { ResolveReportDialog } from './resolve-report-dialog'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-viewer',
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

const ALL = ['reports.handle', 'posts.delete-any', 'users.suspend']

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient
let answer: () => Promise<Response>
const onClose = vi.fn()

function problem(status: number, body: object = {}) {
  return Promise.resolve(
    Response.json(body, {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    }),
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  refreshCurrentUser.mockClear()
  onClose.mockClear()
  vi.stubGlobal('fetch', fetchMock)
  granted = ALL
  answer = () => Promise.resolve(new Response(null, { status: 204 }))
  fetchMock.mockImplementation(() => answer())
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function renderDialog(targetType: ReportTargetType = 'Post') {
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <ResolveReportDialog
          reportId="report-1"
          targetType={targetType}
          onClose={onClose}
        />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const text = (key: string) => String(i18n.t(key as never))

async function choose(outcome: string) {
  await userEvent.click(
    screen.getByRole('radio', {
      name: text(`admin.reports.outcomes.${outcome}`),
    }),
  )
  await userEvent.click(
    screen.getByRole('button', { name: text('admin.reports.continue') }),
  )
}

async function confirm(outcome: string) {
  await userEvent.click(
    await screen.findByRole('button', {
      name: text(`admin.reports.confirm.${outcome}`),
    }),
  )
}

test.each([
  ['Post', ALL, ['Dismissed', 'ContentRemoved', 'UserSuspended']],
  ['User', ALL, ['Dismissed', 'UserSuspended']],
  ['Post', ['reports.handle'], ['Dismissed']],
  [
    'Post',
    ['reports.handle', 'posts.delete-any'],
    ['Dismissed', 'ContentRemoved'],
  ],
  ['Post', ['reports.handle', 'users.suspend'], ['Dismissed', 'UserSuspended']],
  ['Post', ['posts.delete-any', 'users.suspend'], []],
] as const)(
  'a %s report with %j offers %j',
  (targetType, permissions, expected) => {
    expect(availableOutcomes(targetType, permissions)).toEqual(expected)
  },
)

test('shows only the allowed choices and hides removal for a user report', async () => {
  renderDialog('User')

  expect(
    screen.getByRole('radio', {
      name: text('admin.reports.outcomes.Dismissed'),
    }),
  ).toBeVisible()
  expect(
    screen.getByRole('radio', {
      name: text('admin.reports.outcomes.UserSuspended'),
    }),
  ).toBeVisible()
  expect(
    screen.queryByRole('radio', {
      name: text('admin.reports.outcomes.ContentRemoved'),
    }),
  ).toBeNull()
})

test('names the consequence and the other reports before sending, then sends the outcome', async () => {
  renderDialog('Post')

  await choose('UserSuspended')

  expect(
    screen.getByText(text('admin.reports.consequences.UserSuspended.Post')),
  ).toBeVisible()
  expect(screen.getByText(text('admin.reports.alsoResolves'))).toBeVisible()
  expect(fetchMock).not.toHaveBeenCalled()

  await confirm('UserSuspended')

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  const [input, init] = fetchMock.mock.calls[0]
  expect(String(input)).toContain('/reports/report-1/resolution')
  expect(init?.method).toBe('PUT')
  expect(JSON.parse(String(init?.body))).toEqual({ outcome: 'UserSuspended' })
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})

test('sends ContentRemoved and says the post will be deleted', async () => {
  renderDialog('Post')

  await choose('ContentRemoved')
  expect(
    screen.getByText(text('admin.reports.consequences.ContentRemoved.Post')),
  ).toBeVisible()
  await confirm('ContentRemoved')

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
    outcome: 'ContentRemoved',
  })
})

test('refreshes the report queue and the admin counts after a 204', async () => {
  client.setQueryData(['reports', 'clerk-viewer'], [])
  client.setQueryData(['admin-counts', 'clerk-viewer'], { openReports: 3 })
  renderDialog('Post')

  await choose('Dismissed')
  await confirm('Dismissed')

  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(client.getQueryState(['reports', 'clerk-viewer'])?.isInvalidated).toBe(
    true,
  )
  expect(
    client.getQueryState(['admin-counts', 'clerk-viewer'])?.isInvalidated,
  ).toBe(true)
})

test.each([
  [400, 'Report.OutcomeNotApplicable'],
  [400, 'User.CannotSuspendSelf'],
  [403, 'Permission.Denied'],
  [404, 'Report.NotFound'],
  [404, 'User.NotFound'],
  [409, 'User.LastAdministrator'],
])(
  'explains %i %s and stays open to choose another outcome',
  async (status, code) => {
    answer = () => problem(status, { code })
    renderDialog('Post')

    await choose('UserSuspended')
    await confirm('UserSuspended')

    expect(
      await screen.findByText(text(`admin.reports.errors.${code}`)),
    ).toBeVisible()
    expect(onClose).not.toHaveBeenCalled()
    // Back on the choices, so another outcome can be picked.
    expect(
      screen.getByRole('radio', {
        name: text('admin.reports.outcomes.Dismissed'),
      }),
    ).toBeVisible()
    if (code === 'Permission.Denied') {
      await waitFor(() => expect(refreshCurrentUser).toHaveBeenCalled())
    }
  },
)

test('explains a 400 on the outcome field', async () => {
  answer = () =>
    problem(400, {
      errors: { outcome: ['invalid'] },
      errorCodes: { outcome: ['Report.Outcome.Invalid'] },
    })
  renderDialog('Post')

  await choose('Dismissed')
  await confirm('Dismissed')

  expect(
    await screen.findByText(text('admin.reports.errors.outcome')),
  ).toBeVisible()
  expect(onClose).not.toHaveBeenCalled()
})

test('can choose Dismissed after a refusal', async () => {
  answer = () => problem(409, { code: 'User.LastAdministrator' })
  renderDialog('Post')
  await choose('UserSuspended')
  await confirm('UserSuspended')
  await screen.findByText(text('admin.reports.errors.User.LastAdministrator'))

  answer = () => Promise.resolve(new Response(null, { status: 204 }))
  await choose('Dismissed')
  await confirm('Dismissed')

  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
    outcome: 'Dismissed',
  })
})
