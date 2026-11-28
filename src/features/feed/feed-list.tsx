import type { UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { PostCardSkeletons, TimelinePostCard } from '@/features/posts'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

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
    return <PostCardSkeletons />
  }

  // Like every item in the feed column, the error and the empty state sit in
  // a card.
  if (!feed.data) {
    return (
      <div>
        <section role="alert">
          <h2>{t('feed.loadError')}</h2>
          <p>{t('feed.loadErrorHint')}</p>
          {
            <button
              type="button"
              aria-busy={feed.isFetching || undefined}
              disabled={feed.isFetching}
              onClick={() => void feed.refetch()}
            >
              {t('common.retry')}
            </button>
          }
        </section>
      </div>
    )
  }

  if (items.length === 0) {
    return <div>{empty}</div>
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
              <PostCardSkeletons />
            ) : null
          ) : (
            <div>
              {feed.isFetchNextPageError ? (
                <div role="alert">{t('feed.loadError')}</div>
              ) : null}
              <button
                type="button"
                aria-busy={feed.isFetchingNextPage || undefined}
                disabled={feed.isFetching || feed.isFetchingNextPage}
                onClick={loadMore}
              >
                {t('posts.loadMore')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p>{t('feed.end')}</p>
      )}
    </>
  )
}
