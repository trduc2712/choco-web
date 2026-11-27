import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Stack } from '@/components/stack/stack'
import { Tabs } from '@/components/tabs/tabs'
import type { useProfilePosts } from '@/features/posts'
import {
  FEED_SKELETON_COUNT,
  PostCardSkeletons,
  TimelinePostCard,
} from '@/features/posts'
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
              <Card>
                <EmptyState
                  icon="image"
                  title={t('profile.mediaUnavailable')}
                />
              </Card>
            </div>
          ),
        },
        {
          id: 'follows',
          label: t('profile.follow'),
          content: (
            <Card
              className={cx('profile-posts-column', 'profile-posts-follows')}
            >
              <Tabs
                label={t('profile.followTabs')}
                variant="chip"
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
            </Card>
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
      <EmptyState
        size="sm"
        icon="user-x"
        title={t('blocks.postsHidden', { username: blockedUsername })}
      />
    )
  }

  if (posts.isPending) {
    return <PostCardSkeletons count={FEED_SKELETON_COUNT} />
  }

  if (!posts.data) {
    return (
      <EmptyState
        size="sm"
        role="alert"
        title={t('posts.loadError')}
        action={
          <Button
            variant="secondary"
            onClick={() => void posts.refetch()}
            isLoading={posts.isFetching}
          >
            {t('common.retry')}
          </Button>
        }
      />
    )
  }

  const items = posts.data.pages.flatMap((page) => page.items)
  if (items.length === 0) {
    return <EmptyState size="sm" title={t('posts.empty')} />
  }

  return (
    <Stack>
      {items.map((post) => (
        <TimelinePostCard key={post.id} post={post} />
      ))}
      {posts.hasNextPage ? (
        <div ref={sentinelRef}>
          {isAutomatic && !posts.isFetchNextPageError ? (
            // The next page loads in as more post placeholders.
            posts.isFetchingNextPage ? (
              <PostCardSkeletons count={2} />
            ) : null
          ) : (
            <Stack align="center">
              {posts.isFetchNextPageError ? (
                <Alert tone="danger" role="alert">
                  {t('posts.loadError')}
                </Alert>
              ) : null}
              <Button
                variant="secondary"
                disabled={posts.isFetching}
                isLoading={posts.isFetchingNextPage}
                onClick={loadMore}
              >
                {t('posts.loadMore')}
              </Button>
            </Stack>
          )}
        </div>
      ) : null}
    </Stack>
  )
}
