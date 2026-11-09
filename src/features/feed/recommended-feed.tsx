import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state/empty-state'

import { FeedList } from './feed-list'
import { useRecommendedFeed } from './following-feed-api'

export function RecommendedFeed() {
  const { t } = useTranslation()
  const { query: feed } = useRecommendedFeed()

  return (
    <FeedList
      feed={feed}
      empty={<EmptyState size="sm" title={t('feed.recommendedEmpty')} />}
    />
  )
}
