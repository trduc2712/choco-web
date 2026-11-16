import type { UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'
import {
  FEED_SKELETON_COUNT,
  PostCardSkeletons,
  TimelinePostCard,
} from '@/features/posts'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import styles from './feed-list.module.scss'
import type { FeedPage } from './following-feed-api'

type FeedListProps = {
  feed: UseInfiniteQueryResult<{ pages: FeedPage[] }>
  empty: ReactNode
}

export function FeedList({ feed, empty }: FeedListProps) {
  const { t } = useTranslation()
  const items = feed.data?.pages.flatMap((page) => page.items) ?? []
  const { fetchNextPage } = feed
  const loadMore = useCallback(
    () => void fetchNextPage({ cancelRefetch: false }),
    [fetchNextPage],
  )
  const { sentinelRef, isAutomatic } = useInfiniteScroll({
    hasNextPage: feed.hasNextPage,
    isFetching: feed.isFetching,
    isPaused: feed.isFetchNextPageError,
    onLoadMore: loadMore,
  })

  if (feed.isPending) {
    return <PostCardSkeletons count={FEED_SKELETON_COUNT} />
  }

  // Like every item in the feed column, the error and the empty state sit in
  // a card.
  if (!feed.data) {
    return (
      <Card>
        <EmptyState
          size="sm"
          role="alert"
          icon="alert-circle"
          title={t('feed.loadError')}
          description={t('feed.loadErrorHint')}
          action={
            <Button
              variant="secondary"
              onClick={() => void feed.refetch()}
              isLoading={feed.isFetching}
            >
              {t('common.retry')}
            </Button>
          }
        />
      </Card>
    )
  }

  if (items.length === 0) {
    return <Card>{empty}</Card>
  }

  return (
    <>
      {items.map((post) => (
        <TimelinePostCard key={post.id} post={post} />
      ))}
      {feed.hasNextPage ? (
        <div ref={sentinelRef}>
          {isAutomatic && !feed.isFetchNextPageError ? (
            // The next page loads in as more post placeholders.
            feed.isFetchingNextPage ? (
              <PostCardSkeletons count={2} />
            ) : null
          ) : (
            <Stack align="center" className={styles.controls}>
              {feed.isFetchNextPageError ? (
                <Alert tone="danger" role="alert">
                  {t('feed.loadError')}
                </Alert>
              ) : null}
              <Button
                variant="secondary"
                disabled={feed.isFetching}
                isLoading={feed.isFetchingNextPage}
                onClick={loadMore}
              >
                {t('posts.loadMore')}
              </Button>
            </Stack>
          )}
        </div>
      ) : (
        <Text size="sm" tone="muted" align="center" className={styles.end}>
          {t('feed.end')}
        </Text>
      )}
    </>
  )
}
