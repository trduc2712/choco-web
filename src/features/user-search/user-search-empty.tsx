import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Text } from '@/components/text/text'

import styles from './user-search.module.scss'

export function UserSearchEmpty({ query }: { query: string }) {
  const { t } = useTranslation()

  return (
    <section
      role="status"
      aria-label={t('userSearch.resultsTitle')}
      className={styles.noResults}
      data-empty=""
    >
      <Icon name="search" size="xl" className={styles.noResultsIcon} />
      <Heading level={2} size="lg" className={styles.noResultsTitle}>
        {t('userSearch.empty', { query })}
      </Heading>
      <Text tone="muted" size="sm">
        {t('userSearch.emptyHint')}
      </Text>
    </section>
  )
}
