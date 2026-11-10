import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { usePublishPost } from './posts-api'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-viewer',
    getToken: () => Promise.resolve('session-token'),
  }),
}))

const post = {
  id: 'post-1',
  authorId: 'author-1',
  author: { username: 'ada', displayName: 'Ada', avatarUrl: null },
  content: 'Hello',
  likeCount: 0,
  commentCount: 0,
  isLikedByMe: false,
  createdAt: '2026-11-08T09:00:00Z',
  modifiedAt: '2026-11-08T09:00:00Z',
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async () => Response.json(post)),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('publishing a post invalidates the cached profile', async () => {
  const client = new QueryClient()
  client.setQueryData(['profile', 'ada', 'clerk-viewer'], { postCount: 5 })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => usePublishPost(), { wrapper })

  await act(() => result.current.mutateAsync('Hello'))

  await waitFor(() =>
    expect(
      client.getQueryState(['profile', 'ada', 'clerk-viewer'])?.isInvalidated,
    ).toBe(true),
  )
})
