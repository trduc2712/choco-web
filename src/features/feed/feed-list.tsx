import type { UseInfiniteQueryResult } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Spinner } from '@/components/spinner/spinner'
import { Stack } from '@/components/stack/stack'
import type { Post } from '@/features/posts'
import { TextTimelinePost } from '@/features/posts'
import { ApiError } from '@/lib/api-client'

import styles from './feed-list.module.scss'
import type { FeedPage } from './following-feed-api'
import { refreshFeed, useFeedAuthor } from './following-feed-api'

type FeedListProps = {
  feed: UseInfiniteQueryResult<{ pages: FeedPage[] }>
  queryKey: readonly unknown[]
  empty: ReactNode
}

export function FeedList({ feed, queryKey, empty }: FeedListProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const items = feed.data?.pages.flatMap((page) => page.items) ?? []

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

  const refresh = (
    <Stack align="center" className={styles.controls}>
      <Button
        variant="secondary"
        disabled={feed.isFetchingNextPage}
        isLoading={feed.isRefetching && !feed.isFetchingNextPage}
        onClick={() => void refreshFeed(queryClient, queryKey)}
      >
        {t('feed.refresh')}
      </Button>
    </Stack>
  )

  if (items.length === 0) {
    return (
      <>
        {empty}
        {refresh}
      </>
    )
  }

  return (
    <>
      {refresh}
      {items.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
      {feed.hasNextPage ? (
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
            onClick={() => void feed.fetchNextPage({ cancelRefetch: false })}
          >
            {t('posts.loadMore')}
          </Button>
        </Stack>
      ) : null}
    </>
  )
}

function FeedPost({ post }: { post: Post }) {
  const { t } = useTranslation()
  const author = useFeedAuthor(post.authorId)
  const isMissing =
    author.error instanceof ApiError && author.error.status === 404

  return (
    <TextTimelinePost
      post={post}
      isAuthorLoading={author.isPending}
      author={
        author.data
          ? {
              name: author.data.displayName || author.data.username,
              username: author.data.username,
              avatarUrl: author.data.avatarUrl ?? undefined,
            }
          : {
              name: isMissing ? t('feed.authorMissing') : t('feed.authorError'),
            }
      }
    />
  )
}
