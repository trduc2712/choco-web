import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state/empty-state'
import { Stack } from '@/components/stack/stack'

import { UserResultList } from './user-result-list'
import styles from './user-search.module.scss'
import { isValidSearchQuery, useUserSearch } from './user-search-api'
import { UserSearchEmpty } from './user-search-empty'

export function UserSearchResults({ query }: { query: string }) {
  const { t } = useTranslation()
  const valid = isValidSearchQuery(query)

  return (
    <Stack gap={2} className={styles.results}>
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
