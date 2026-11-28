import { useTranslation } from 'react-i18next'

import { FeedList } from './feed-list'
import { useRecommendedFeed } from './following-feed-api'

export function RecommendedFeed() {
  const { t } = useTranslation()
  const { query: feed } = useRecommendedFeed()

  return (
    <FeedList
      feed={feed}
      empty={
        <section>
          <h2>{t('feed.recommendedEmpty')}</h2>
        </section>
      }
    />
  )
}
