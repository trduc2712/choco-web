import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { HOME_PATH } from '@/constants/routes'

import type { FeedTab } from './use-feed-tab'
import { useFeedTab } from './use-feed-tab'

const TABS: {
  id: FeedTab
  labelKey: 'home.feed' | 'home.following'
}[] = [
  { id: 'feed', labelKey: 'home.feed' },
  { id: 'following', labelKey: 'home.following' },
]

export function FeedTabs({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { tab } = useFeedTab()

  return (
    <nav aria-label={t('home.timeline')} className={className}>
      <ul role="list">
        {TABS.map(({ id, labelKey }) => (
          <li key={id}>
            <Link
              to={id === 'feed' ? HOME_PATH : `${HOME_PATH}?tab=${id}`}
              replace
              aria-current={tab === id ? 'page' : undefined}
              aria-label={t(labelKey)}
              title={t(labelKey)}
            >
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
