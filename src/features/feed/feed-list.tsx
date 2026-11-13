import type { UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Spinner } from '@/components/spinner/spinner'
import { Stack } from '@/components/stack/stack'
import { TimelinePostCard } from '@/features/posts'
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
    return (
      <Stack align="center" className={styles.controls}>
        <Spinner />
      </Stack>
    )
  }

  if (!feed.data) {
    return (
      <EmptyState
        size="sm"
        role="alert"
        title={t('feed.loadError')}
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
    )
  }

  if (items.length === 0) {
    return <>{empty}</>
  }

  return (
    <>
      {items.map((post) => (
        <TimelinePostCard key={post.id} post={post} />
      ))}
      {feed.hasNextPage ? (
        <div ref={sentinelRef}>
          <Stack align="center" className={styles.controls}>
            {feed.isFetchNextPageError ? (
              <Alert tone="danger" role="alert">
                {t('feed.loadError')}
              </Alert>
            ) : null}
            {isAutomatic && !feed.isFetchNextPageError ? (
              feed.isFetchingNextPage ? (
                <Spinner />
              ) : null
            ) : (
              <Button
                variant="secondary"
                disabled={feed.isFetching}
                isLoading={feed.isFetchingNextPage}
                onClick={loadMore}
              >
                {t('posts.loadMore')}
              </Button>
            )}
          </Stack>
        </div>
      ) : null}
    </>
  )
}
