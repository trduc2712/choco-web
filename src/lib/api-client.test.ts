import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ApiError, useApiFetch } from '@/lib/api-client'

const getToken = vi.fn<() => Promise<string | null>>()

vi.mock('@clerk/react', () => ({
  useAuth: () => ({ getToken }),
}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetAllMocks()
})

test('sends the Clerk session token as a bearer token', async () => {
  getToken.mockResolvedValue('session-token')
  fetchMock.mockResolvedValue(Response.json({ id: 'user_123' }))
  const { result } = renderHook(() => useApiFetch())

  const body = await result.current<{ id: string }>('/me')

  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('/api/v1/me')
  expect(new Headers(init?.headers).get('Authorization')).toBe(
    'Bearer session-token',
  )
  expect(body).toEqual({ id: 'user_123' })
})

test('uses the configured absolute API URL in production', async () => {
  vi.stubEnv('DEV', false)
  getToken.mockResolvedValue('session-token')
  fetchMock.mockResolvedValue(Response.json({}))
  const { result } = renderHook(() => useApiFetch())

  await result.current('/me')

  expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/v1/me')
})

test('omits the authorization header when there is no session', async () => {
  getToken.mockResolvedValue(null)
  fetchMock.mockResolvedValue(Response.json({}))
  const { result } = renderHook(() => useApiFetch())

  await result.current('/me')

  const [, init] = fetchMock.mock.calls[0]
  expect(new Headers(init?.headers).has('Authorization')).toBe(false)
})

test('throws an ApiError with the status of a failed response', async () => {
  getToken.mockResolvedValue('session-token')
  fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
  const { result } = renderHook(() => useApiFetch())

  await expect(result.current('/me')).rejects.toMatchObject({
    name: ApiError.name,
    status: 401,
  })
})

test('refreshes a rejected cached token once and retries a read request', async () => {
  getToken
    .mockResolvedValueOnce('cached-token')
    .mockResolvedValueOnce('fresh-token')
  fetchMock
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json({ id: 'user_123' }))
  const { result } = renderHook(() => useApiFetch())

  await expect(result.current('/me')).resolves.toEqual({ id: 'user_123' })

  expect(getToken).toHaveBeenNthCalledWith(2, { skipCache: true })
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(
    new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization'),
  ).toBe('Bearer cached-token')
  expect(
    new Headers(fetchMock.mock.calls[1][1]?.headers).get('Authorization'),
  ).toBe('Bearer fresh-token')
})

test('does not loop when the refreshed token is also rejected', async () => {
  getToken.mockResolvedValue('rejected-token')
  fetchMock.mockImplementation(async () => new Response(null, { status: 401 }))
  const { result } = renderHook(() => useApiFetch())

  await expect(result.current('/me')).rejects.toMatchObject({ status: 401 })
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(getToken).toHaveBeenCalledTimes(2)
})

test('does not replay a mutation after an authentication error', async () => {
  getToken.mockResolvedValue('rejected-token')
  fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
  const { result } = renderHook(() => useApiFetch())

  await expect(
    result.current('/posts', { method: 'POST', body: '{}' }),
  ).rejects.toMatchObject({ status: 401 })
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(getToken).not.toHaveBeenCalledWith({ skipCache: true })
})
