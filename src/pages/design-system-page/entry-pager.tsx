import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Icon } from '@/components'
import { cx } from '@/lib/cx'

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
    <nav aria-label={t('docs.pager')}>
      {index > 0 && previous && (
        <RouterLink
          className={cx('entry-pager-link', 'entry-pager-previous')}
          to={getEntryPath(previous.id)}
          rel="prev"
        >
          <span>
            <Icon name="arrow-left" size="sm" />
            {t('docs.previous')}
          </span>
          <span>{previous.name}</span>
        </RouterLink>
      )}
      {next && (
        <RouterLink
          className={cx('entry-pager-link', 'entry-pager-next')}
          to={getEntryPath(next.id)}
          rel="next"
        >
          <span>
            {t('docs.next')}
            <Icon name="arrow-right" size="sm" />
          </span>
          <span>{next.name}</span>
        </RouterLink>
      )}
    </nav>
  )
}
