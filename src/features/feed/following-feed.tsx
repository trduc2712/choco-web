import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state/empty-state'

import { FeedList } from './feed-list'
import { useFollowingFeed, useMyFollowingCount } from './following-feed-api'

export function FollowingFeed() {
  const { t } = useTranslation()
  const { query: feed } = useFollowingFeed()
  const isEmpty =
    feed.data !== undefined && feed.data.pages.every((p) => !p.items.length)
  const followingCount = useMyFollowingCount(isEmpty)

  return (
    <FeedList
      feed={feed}
      empty={
        followingCount.data === 0 ? (
          <EmptyState
            size="sm"
            title={t('feed.noFollowing')}
            description={t('feed.noFollowingHint')}
          />
        ) : (
          <EmptyState size="sm" title={t('feed.empty')} />
        )
      }
    />
  )
}
