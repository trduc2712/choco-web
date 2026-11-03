import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Icon } from '@/components'
import { cx } from '@/lib/cx'

import styles from './entry-pager.module.scss'
import type { ShowcaseEntry } from './showcase-entries'
import { getEntryPath, SHOWCASE_ENTRIES } from './showcase-entries'

type EntryPagerProps = {
  entry: ShowcaseEntry
}

export function EntryPager({ entry }: EntryPagerProps) {
  const { t } = useTranslation('designSystem')
  const index = SHOWCASE_ENTRIES.indexOf(entry)
  const previous = SHOWCASE_ENTRIES.at(index - 1)
  const next = SHOWCASE_ENTRIES.at(index + 1)

  return (
    <nav className={styles.root} aria-label={t('docs.pager')}>
      {index > 0 && previous && (
        <RouterLink
          className={cx(styles.link, styles.previous)}
          to={getEntryPath(previous.id)}
          rel="prev"
        >
          <span className={styles.label}>
            <Icon name="arrow-left" size="sm" />
            {t('docs.previous')}
          </span>
          <span className={styles.name}>{previous.name}</span>
        </RouterLink>
      )}
      {next && (
        <RouterLink
          className={cx(styles.link, styles.next)}
          to={getEntryPath(next.id)}
          rel="next"
        >
          <span className={styles.label}>
            {t('docs.next')}
            <Icon name="arrow-right" size="sm" />
          </span>
          <span className={styles.name}>{next.name}</span>
        </RouterLink>
      )}
    </nav>
  )
}
