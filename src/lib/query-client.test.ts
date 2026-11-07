import { afterEach, expect, test, vi } from 'vitest'

import { ApiError } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'

afterEach(() => queryClient.clear())

test.each([401, 403, 404, 429])('does not retry HTTP %i', async (status) => {
  const error = new ApiError(status)
  const queryFn = vi.fn().mockRejectedValue(error)

  await expect(
    queryClient.fetchQuery({ queryKey: ['test'], queryFn, retryDelay: 0 }),
  ).rejects.toBe(error)
  expect(queryFn).toHaveBeenCalledTimes(1)
})

test.each([
  ['a server error', new ApiError(503)],
  ['a network error', new TypeError('Failed to fetch')],
])('retries %s exactly once', async (_label, error) => {
  const queryFn = vi.fn().mockRejectedValue(error)

  await expect(
    queryClient.fetchQuery({ queryKey: ['test'], queryFn, retryDelay: 0 }),
  ).rejects.toBe(error)
  expect(queryFn).toHaveBeenCalledTimes(2)
})
