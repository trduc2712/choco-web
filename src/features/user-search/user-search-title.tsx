import type { ReactNode } from 'react'

import { Icon } from '@/components/icon/icon'
import { Text } from '@/components/text/text'

import styles from './user-search.module.scss'
import { isValidSearchQuery } from './user-search-api'

// Page title followed by a tag with the searched keyword.
export function UserSearchTitle({
  query,
  children,
}: {
  query: string
  children: ReactNode
}) {
  return (
    <span className={styles.title}>
      {children}
      {isValidSearchQuery(query) ? (
        <span className={styles.queryChip}>
          <Icon name="search" size="sm" />
          <Text as="span" size="sm" weight="semibold">
            <bdi>{query}</bdi>
          </Text>
        </span>
      ) : null}
    </span>
  )
}
