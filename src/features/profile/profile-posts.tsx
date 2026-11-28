import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs } from '@/components/tabs/tabs'
import type { useProfilePosts } from '@/features/posts'
import { PostCardSkeletons, TimelinePostCard } from '@/features/posts'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { cx } from '@/lib/cx'

import { FollowList } from './follow-list-screen'

type ProfilePostsProps = {
  posts: ReturnType<typeof useProfilePosts>
  // Set when the viewer blocked this user; the API then returns no posts.
  blockedUsername?: string
}

export function ProfilePosts({
  userId,
  name,
  ...props
}: ProfilePostsProps & { userId: string; name: string }) {
  const { t } = useTranslation()

  return (
    <Tabs
      label={t('profile.activity')}
      items={[
        {
          id: 'posts',
          label: t('profile.posts'),
          content: (
            <div>
              <ProfilePostList {...props} />
            </div>
          ),
        },
        {
          id: 'media',
          label: t('profile.media'),
          content: (
            <div>
              <div>
                <section>
                  <h2>{t('profile.mediaUnavailable')}</h2>
                </section>
              </div>
            </div>
          ),
        },
        {
          id: 'follows',
          label: t('profile.follow'),
          content: (
            <div
              className={cx('profile-posts-column', 'profile-posts-follows')}
            >
              <Tabs
                label={t('profile.followTabs')}
                items={(['followers', 'following'] as const).map((kind) => ({
                  id: kind,
                  label: t(`profile.${kind}`),
                  content: (
                    <FollowList
                      kind={kind}
                      userId={userId}
                      name={name}
                      isCompact
                    />
                  ),
                }))}
              />
            </div>
          ),
        },
      ]}
    />
  )
}

function ProfilePostList({ posts, blockedUsername }: ProfilePostsProps) {
  const { t } = useTranslation()
  const { fetchNextPage } = posts
  const loadMore = useCallback(
    () => void fetchNextPage({ cancelRefetch: false }),
    [fetchNextPage],
  )
  const { sentinelRef, isAutomatic } = useInfiniteScroll({
    hasNextPage: posts.hasNextPage,
    isFetching: posts.isFetching,
    isPaused: posts.isFetchNextPageError,
    onLoadMore: loadMore,
  })

  if (blockedUsername !== undefined) {
    return (
      <section>
        <h2>{t('blocks.postsHidden', { username: blockedUsername })}</h2>
      </section>
    )
  }

  if (posts.isPending) {
    return <PostCardSkeletons />
  }

  if (!posts.data) {
    return (
      <section role="alert">
        <h2>{t('posts.loadError')}</h2>
        {
          <button
            type="button"
            aria-busy={posts.isFetching || undefined}
            disabled={posts.isFetching}
            onClick={() => void posts.refetch()}
          >
            {t('common.retry')}
          </button>
        }
      </section>
    )
  }

  const items = posts.data.pages.flatMap((page) => page.items)
  if (items.length === 0) {
    return (
      <section>
        <h2>{t('posts.empty')}</h2>
      </section>
    )
  }

  return (
    <div>
      {items.map((post) => (
        <TimelinePostCard key={post.id} post={post} />
      ))}
      {posts.hasNextPage ? (
        <div ref={sentinelRef}>
          {isAutomatic && !posts.isFetchNextPageError ? (
            // The next page loads in as more post placeholders.
            posts.isFetchingNextPage ? (
              <PostCardSkeletons />
            ) : null
          ) : (
            <div>
              {posts.isFetchNextPageError ? (
                <div role="alert">{t('posts.loadError')}</div>
              ) : null}
              <button
                type="button"
                aria-busy={posts.isFetchingNextPage || undefined}
                disabled={posts.isFetching || posts.isFetchingNextPage}
                onClick={loadMore}
              >
                {t('posts.loadMore')}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
