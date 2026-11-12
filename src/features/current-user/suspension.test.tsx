import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { i18n } from '@/i18n/i18n'
import { useApiFetch } from '@/lib/api-client'

import { SuspensionBanner } from './suspension-banner'
import { SuspensionProvider } from './suspension-provider'
import { useCurrentUser } from './use-current-user'
import { useSuspension } from './use-suspension'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-viewer',
    sessionId: 'session',
    getToken: () => Promise.resolve('token'),
  }),
}))

const SUSPENSION = {
  reason: 'Repeated spam',
  suspendedAt: '2026-01-01T00:00:00Z',
}

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient
// What GET /me answers; a test changes it to play an administrator's action.
let me: { id: string; suspension: typeof SUSPENSION | null }

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  me = { id: 'me', suspension: null }
  fetchMock.mockImplementation((input, init) => {
    const url = String(input)
    if (url.endsWith('/me')) return Promise.resolve(Response.json(me))
    if (init?.method === 'POST' && url.endsWith('/posts')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            status: 403,
            code: 'User.Suspended',
            suspension: SUSPENSION,
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      )
    }
    return Promise.resolve(new Response(null, { status: 204 }))
  })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

// The layouts ask for GET /me (through the permissions); the banner and the
// controls only read the answer.
function Asker() {
  useCurrentUser()
  return null
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <SuspensionProvider>
          <Asker />
          {children}
        </SuspensionProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

function meCalls() {
  return fetchMock.mock.calls.filter(([input]) => String(input).endsWith('/me'))
}

function WriteButton() {
  const apiFetch = useApiFetch()
  const { isSuspended } = useSuspension()
  return (
    <button
      disabled={isSuspended}
      onClick={() =>
        void apiFetch('/posts', { method: 'POST' }).catch(() => undefined)
      }
    >
      write
    </button>
  )
}

test('shows no notice when GET /me has no suspension', async () => {
  render(
    <Providers>
      <SuspensionBanner />
      <WriteButton />
    </Providers>,
  )

  await waitFor(() => expect(meCalls()).toHaveLength(1))
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.getByRole('button', { name: 'write' })).toBeEnabled()
})

test('shows the reason and the date from GET /me and disables writes', async () => {
  me = { id: 'me', suspension: SUSPENSION }

  render(
    <Providers>
      <SuspensionBanner />
      <WriteButton />
    </Providers>,
  )

  const notice = await screen.findByRole('status')
  expect(notice).toHaveTextContent(i18n.t('suspension.title'))
  expect(notice).toHaveTextContent('Repeated spam')
  expect(notice).toHaveTextContent('2026')
  expect(screen.getByRole('button', { name: 'write' })).toBeDisabled()
})

test('a refused write tells why, asks GET /me again and the notice appears', async () => {
  render(
    <Providers>
      <SuspensionBanner />
      <WriteButton />
    </Providers>,
  )
  await waitFor(() => expect(meCalls()).toHaveLength(1))
  me = { id: 'me', suspension: SUSPENSION }

  await userEvent.click(screen.getByRole('button', { name: 'write' }))

  expect(
    (await screen.findAllByText(i18n.t('suspension.refused'))).length,
  ).toBeGreaterThan(0)
  await waitFor(() => expect(meCalls()).toHaveLength(2))
  expect(await screen.findByRole('status')).toHaveTextContent('Repeated spam')
  expect(screen.getByRole('button', { name: 'write' })).toBeDisabled()
})

test('the notice goes away once the suspension is lifted', async () => {
  me = { id: 'me', suspension: SUSPENSION }
  render(
    <Providers>
      <SuspensionBanner />
    </Providers>,
  )
  await screen.findByRole('status')

  me = { id: 'me', suspension: null }
  await client.invalidateQueries({ queryKey: ['current-user'] })

  await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
})
