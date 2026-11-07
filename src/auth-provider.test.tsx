import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { AuthProvider } from '@/auth-provider'
import { useApiFetch } from '@/lib/api-client'

const clerk = {
  session: { id: 'session_1' },
  signOut: vi.fn<() => Promise<void>>(),
}
const getToken = vi.fn<() => Promise<string | null>>()
const fetchMock = vi.fn<typeof fetch>()

vi.mock('@clerk/react', () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ sessionId: 'session_1', getToken }),
  useClerk: () => clerk,
}))

vi.mock('@/router', () => ({
  router: {
    state: {
      location: { pathname: '/@ada', search: '?tab=posts', hash: '#latest' },
    },
  },
}))

beforeEach(() => {
  clerk.session = { id: 'session_1' }
  clerk.signOut.mockResolvedValue(undefined)
  getToken.mockResolvedValue('token')
  fetchMock.mockImplementation(async () => new Response(null, { status: 401 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

test('signs out once after simultaneous read requests reject the refreshed token', async () => {
  let finishSignOut!: () => void
  clerk.signOut.mockReturnValue(
    new Promise<void>((resolve) => {
      finishSignOut = resolve
    }),
  )
  const { result } = renderHook(() => useApiFetch(), { wrapper: AuthProvider })

  await Promise.all([
    expect(result.current('/me')).rejects.toMatchObject({ status: 401 }),
    expect(result.current('/users/by-username/ada')).rejects.toMatchObject({
      status: 401,
    }),
  ])

  expect(clerk.signOut).toHaveBeenCalledExactlyOnceWith({
    sessionId: 'session_1',
    redirectUrl: '/sign-in?redirect_url=%2F%40ada%3Ftab%3Dposts%23latest',
  })
  finishSignOut()
})

test('keeps the session when a read succeeds after refreshing the token', async () => {
  fetchMock
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json({ id: 'ada' }))
  const { result } = renderHook(() => useApiFetch(), { wrapper: AuthProvider })

  await expect(result.current('/me')).resolves.toEqual({ id: 'ada' })
  expect(clerk.signOut).not.toHaveBeenCalled()
})

test('recovers an ended session without replaying a write', async () => {
  getToken.mockResolvedValueOnce('cached-token').mockResolvedValueOnce(null)
  const { result } = renderHook(() => useApiFetch(), { wrapper: AuthProvider })

  await expect(
    result.current('/posts', { method: 'POST' }),
  ).rejects.toMatchObject({
    status: 401,
  })
  expect(getToken).toHaveBeenLastCalledWith({ skipCache: true })
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(clerk.signOut).toHaveBeenCalledTimes(1)
})

test('ignores an unauthorized response from a superseded session', async () => {
  clerk.session = { id: 'session_2' }
  const { result } = renderHook(() => useApiFetch(), { wrapper: AuthProvider })

  await expect(result.current('/me')).rejects.toMatchObject({ status: 401 })
  expect(clerk.signOut).not.toHaveBeenCalled()
})
