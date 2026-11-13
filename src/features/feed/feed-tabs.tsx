import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { HOME_PATH } from '@/constants/routes'

import styles from './feed-tabs.module.scss'
import type { FeedTab } from './use-feed-tab'
import { useFeedTab } from './use-feed-tab'

const TABS: {
  id: FeedTab
  icon: IconName
  labelKey: 'home.feed' | 'home.following'
}[] = [
  { id: 'feed', icon: 'home', labelKey: 'home.feed' },
  { id: 'following', icon: 'users', labelKey: 'home.following' },
]

// Icon tabs for the app header; the selected one gets a bar along the bottom.
export function FeedTabs({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { tab } = useFeedTab()

  return (
    <nav aria-label={t('home.timeline')} className={className}>
      <ul role="list" className={styles.tabs}>
        {TABS.map(({ id, icon, labelKey }) => (
          <li key={id} className={styles.item}>
            <Link
              to={id === 'feed' ? HOME_PATH : `${HOME_PATH}?tab=${id}`}
              replace
              className={styles.tab}
              aria-current={tab === id ? 'page' : undefined}
              aria-label={t(labelKey)}
              title={t(labelKey)}
            >
              <Icon name={icon} size="lg" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
