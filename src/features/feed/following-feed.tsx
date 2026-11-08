import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { Spinner } from '@/components/spinner/spinner'
import { Stack } from '@/components/stack/stack'
import { USER_SEARCH_PATH } from '@/constants/routes'
import type { Post } from '@/features/posts'
import { TextTimelinePost } from '@/features/posts'
import { ApiError } from '@/lib/api-client'

import styles from './following-feed.module.scss'
import {
  useFeedAuthor,
  useFollowingFeed,
  useMyFollowingCount,
} from './following-feed-api'

export function FollowingFeed() {
  const { t } = useTranslation()
  const feed = useFollowingFeed()
  const items = feed.data?.pages.flatMap((page) => page.items) ?? []
  const isEmpty = feed.data !== undefined && items.length === 0
  const followingCount = useMyFollowingCount(isEmpty)

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

  if (isEmpty) {
    return followingCount.data === 0 ? (
      <EmptyState
        size="sm"
        title={t('feed.noFollowing')}
        description={t('feed.noFollowingHint')}
        action={<Link to={USER_SEARCH_PATH}>{t('feed.findPeople')}</Link>}
      />
    ) : (
      <EmptyState size="sm" title={t('feed.empty')} />
    )
  }

  return (
    <>
      {items.map((post) => (
        <FollowingFeedPost key={post.id} post={post} />
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

function FollowingFeedPost({ post }: { post: Post }) {
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
