import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { Spinner } from '@/components/spinner/spinner'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { userProfilePath } from '@/constants/routes'
import type { PageResponse } from '@/lib/page-response'

import styles from './user-search.module.scss'
import type { UserSearchItem } from './user-search-api'
import { UserSearchIdentity } from './user-search-identity'

export function UserResultList({
  results,
  loadingLabel,
  errorTitle,
  empty,
}: {
  results: UseInfiniteQueryResult<InfiniteData<PageResponse<UserSearchItem>>>
  loadingLabel: string
  errorTitle: string
  empty: ReactNode
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const users = results.data?.pages.flatMap((page) => page.items) ?? []
  const listRef = useRef<HTMLUListElement>(null)
  const pendingFocus = useRef<{
    index: number
    trigger: HTMLButtonElement
  } | null>(null)

  useEffect(() => {
    if (results.isFetchingNextPage || !pendingFocus.current) return
    const { index, trigger } = pendingFocus.current
    pendingFocus.current = null
    if (
      document.activeElement === trigger ||
      (!trigger.isConnected && document.activeElement === document.body)
    ) {
      listRef.current?.children.item(index)?.querySelector('a')?.focus()
    }
  }, [results.isFetchingNextPage, users.length])

  if (results.isPending)
    return (
      <div role="status" className={styles.resultsLoading}>
        <Spinner tone="primary" isDecorative />
        <Text size="sm" tone="muted">
          {loadingLabel}
        </Text>
      </div>
    )

  if (!results.data) {
    return (
      <EmptyState
        size="sm"
        role="alert"
        icon="search"
        className={styles.resultsPanel}
        title={errorTitle}
        action={
          <Button
            variant="secondary"
            isLoading={results.isFetching}
            onClick={() => void results.refetch()}
          >
            {t('common.retry')}
          </Button>
        }
      />
    )
  }

  if (users.length === 0) return empty

  return (
    <>
      <VisuallyHidden role="status">
        {t('userSearch.shown', { count: users.length })}
      </VisuallyHidden>
      <ul ref={listRef} className={styles.resultsList} role="list">
        {users.map((user) => (
          <li key={user.username}>
            <Link
              to={userProfilePath(user.username)}
              variant="standalone"
              className={styles.resultLink}
              onClick={(event) => {
                if (
                  event.defaultPrevented ||
                  event.detail === 0 ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return
                event.preventDefault()
                void navigate(userProfilePath(user.username), {
                  state: { skipHeadingFocus: true },
                })
              }}
            >
              <UserSearchIdentity
                user={user}
                avatarUrl={user.avatarUrl ?? undefined}
                size="lg"
              />
            </Link>
          </li>
        ))}
      </ul>
      {results.isError ? (
        <Alert tone="danger" role="alert">
          {t(
            results.isFetchNextPageError
              ? 'userSearch.moreError'
              : 'userSearch.resultsError',
          )}
        </Alert>
      ) : null}
      {results.hasNextPage ? (
        <Button
          className={styles.loadMore}
          variant="secondary"
          isLoading={results.isFetchingNextPage}
          onClick={(event) => {
            if (results.isFetching) return
            if (event.detail === 0)
              pendingFocus.current = {
                index: users.length,
                trigger: event.currentTarget,
              }
            void results.fetchNextPage({ cancelRefetch: false })
          }}
        >
          {t(
            results.isFetchNextPageError
              ? 'common.retry'
              : 'userSearch.loadMore',
          )}
        </Button>
      ) : null}
    </>
  )
}
