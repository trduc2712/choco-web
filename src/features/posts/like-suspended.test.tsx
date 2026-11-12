import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { SuspensionProvider } from '@/features/current-user'
import { i18n } from '@/i18n/i18n'

import type { Post } from './posts-api'
import { useLikePost } from './use-like-post'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-viewer',
    sessionId: 'session',
    getToken: () => Promise.resolve('token'),
  }),
}))

const POST: Post = {
  id: 'post-1',
  authorId: 'author-1',
  author: { username: 'ada', displayName: 'Ada', avatarUrl: null },
  content: 'Hello',
  likeCount: 3,
  commentCount: 0,
  isLikedByMe: false,
  createdAt: '2026-11-08T09:00:00Z',
  modifiedAt: '2026-11-08T09:00:00Z',
}

const fetchMock = vi.fn<typeof fetch>()
let client: QueryClient

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function Harness() {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: () => Promise.resolve([POST]),
    meta: { listsPosts: true },
    staleTime: Infinity,
  })
  const { setLiked } = useLikePost(POST.id)
  const post = data?.[0]
  if (!post) return null
  return (
    <button onClick={() => setLiked(true)}>
      {post.isLikedByMe ? 'liked' : 'not liked'} {post.likeCount}
    </button>
  )
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <SuspensionProvider>{children}</SuspensionProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

test('a like refused with User.Suspended is rolled back and explained', async () => {
  fetchMock.mockImplementation((input) =>
    Promise.resolve(
      String(input).endsWith('/me')
        ? Response.json({ id: 'me', suspension: null })
        : new Response(
            JSON.stringify({
              status: 403,
              code: 'User.Suspended',
              suspension: {
                reason: 'Repeated spam',
                suspendedAt: '2026-01-01T00:00:00Z',
              },
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/problem+json' },
            },
          ),
    ),
  )
  render(
    <Providers>
      <Harness />
    </Providers>,
  )

  await userEvent.click(
    await screen.findByRole('button', { name: 'not liked 3' }),
  )

  await waitFor(() =>
    expect(
      screen.getAllByText(i18n.t('suspension.refused')).length,
    ).toBeGreaterThan(0),
  )
  expect(screen.getByRole('button', { name: 'not liked 3' })).toBeVisible()
})
