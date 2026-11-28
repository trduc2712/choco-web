import { useTranslation } from 'react-i18next'

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
          <section>
            <h2>{t('feed.noFollowing')}</h2>
            <p>{t('feed.noFollowingHint')}</p>
          </section>
        ) : (
          <section>
            <h2>{t('feed.empty')}</h2>
          </section>
        )
      }
    />
  )
}
