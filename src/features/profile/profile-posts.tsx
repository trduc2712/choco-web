import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Spinner } from '@/components/spinner/spinner'
import { Stack } from '@/components/stack/stack'
import { Tabs } from '@/components/tabs/tabs'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import type { useProfilePosts } from '@/features/posts'
import { TimelinePostCard } from '@/features/posts'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { FollowList } from './follow-list-screen'
import styles from './profile-posts.module.scss'

type ProfilePostsProps = {
  posts: ReturnType<typeof useProfilePosts>
  // Set when the viewer blocked this user; the API then returns no posts.
  blockedUsername?: string
}

export function ProfilePosts({
  intro,
  userId,
  name,
  ...props
}: ProfilePostsProps & { intro: ReactNode; userId: string; name: string }) {
  const { t } = useTranslation()
  const withIntro = (content: ReactNode) => (
    <div className={styles.columns}>
      {intro}
      <div className={styles.activity}>{content}</div>
    </div>
  )

  return (
    <Tabs
      label={t('profile.activity')}
      className={styles.tabs}
      items={[
        {
          id: 'posts',
          label: t('profile.posts'),
          content: withIntro(<ProfilePostList {...props} />),
        },
        {
          id: 'media',
          label: t('profile.media'),
          content: (
            <Card>
              <EmptyState icon="image" title={t('profile.mediaUnavailable')} />
            </Card>
          ),
        },
        {
          id: 'follows',
          label: t('profile.follow'),
          content: (
            <Card className={styles.follows}>
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

export function ProfilePostSkeletons() {
  const { t } = useTranslation()
  return (
    <Stack role="status">
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
      {[0, 1].map((index) => (
        <Card key={index} className={styles.postSkeleton}>
          <Stack direction="row" align="center" gap={3}>
            <Skeleton
              shape="circle"
              width="var(--size-avatar-md)"
              height="var(--size-avatar-md)"
            />
            <Skeleton width="var(--space-9)" lines={2} />
          </Stack>
          <Skeleton width="var(--size-measure-sm)" />
        </Card>
      ))}
    </Stack>
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
    return <ProfilePostSkeletons />
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
          <Stack align="center" className={styles.controls}>
            {posts.isFetchNextPageError ? (
              <Alert tone="danger" role="alert">
                {t('posts.loadError')}
              </Alert>
            ) : null}
            {isAutomatic && !posts.isFetchNextPageError ? (
              posts.isFetchingNextPage ? (
                <Spinner />
              ) : null
            ) : (
              <Button
                variant="secondary"
                disabled={posts.isFetching}
                isLoading={posts.isFetchingNextPage}
                onClick={loadMore}
              >
                {t('posts.loadMore')}
              </Button>
            )}
          </Stack>
        </div>
      ) : null}
    </Stack>
  )
}
