import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state/empty-state'
import { Heading } from '@/components/heading/heading'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'

import { UserResultList } from './user-result-list'
import styles from './user-search.module.scss'
import { isValidSearchQuery, useUserSearch } from './user-search-api'
import { UserSearchEmpty } from './user-search-empty'

export function UserSearchResults({ query }: { query: string }) {
  const { t } = useTranslation()
  const valid = isValidSearchQuery(query)

  return (
    <Stack className={styles.results}>
      <header className={styles.resultsHeader}>
        <Heading level={1} size="2xl">
          {t('userSearch.resultsTitle')}
        </Heading>
        {valid ? (
          <Text size="sm" tone="muted">
            {t('userSearch.resultsFor', { query })}
          </Text>
        ) : null}
      </header>
      {valid ? (
        <ResultList key={query} query={query} />
      ) : (
        <EmptyState
          size="sm"
          icon="search"
          className={styles.resultsPanel}
          title={t(query ? 'userSearch.invalid' : 'userSearch.prompt')}
        />
      )}
    </Stack>
  )
}

function ResultList({ query }: { query: string }) {
  const { t } = useTranslation()
  const results = useUserSearch(query)

  return (
    <UserResultList
      results={results}
      loadingLabel={t('userSearch.searching')}
      errorTitle={t('userSearch.resultsError')}
      empty={<UserSearchEmpty query={query} />}
    />
  )
}
