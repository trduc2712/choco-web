import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'
import { useNavigate } from 'react-router'

import { userProfilePath } from '@/constants/routes'
import { getAvatarUrl } from '@/lib/avatar-url'
import { cx } from '@/lib/cx'
import type { PageResponse } from '@/lib/page-response'

import { FollowButton } from './follow-button'
import { UserRowSkeletons } from './user-row-skeletons'
import type { UserSearchItem } from './user-search-api'
import { UserSearchIdentity } from './user-search-identity'

export function UserResultList({
  results,
  loadingLabel,
  errorTitle,
  empty,
  isCompact = false,
  renderAction = (user) => <FollowButton user={user} isCompact={isCompact} />,
}: {
  results: UseInfiniteQueryResult<InfiniteData<PageResponse<UserSearchItem>>>
  loadingLabel: string
  errorTitle: string
  empty: ReactNode
  isCompact?: boolean
  // The control at the end of each row. Defaults to Follow / Unfollow.
  renderAction?: (user: UserSearchItem) => ReactNode
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

  if (results.isPending) {
    return <UserRowSkeletons label={loadingLabel} />
  }

  if (!results.data) {
    return (
      <section role="alert">
        <h2>{errorTitle}</h2>
        {
          <button
            type="button"
            aria-busy={results.isFetching || undefined}
            disabled={results.isFetching}
            onClick={() => void results.refetch()}
          >
            {t('common.retry')}
          </button>
        }
      </section>
    )
  }

  if (users.length === 0) return empty

  return (
    <>
      <span className="visually-hidden" role="status">
        {t('userSearch.shown', { count: users.length })}
      </span>
      <ul
        ref={listRef}
        className={cx(
          'user-search-resultsList',
          isCompact && 'user-search-compactResults',
        )}
        role="list"
      >
        {users.map((user) => (
          <li key={user.id}>
            <RouterLink
              to={userProfilePath(user.username)}
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
                avatarUrl={getAvatarUrl(user.avatarUrl)}
              />
            </RouterLink>
            {renderAction(user)}
          </li>
        ))}
      </ul>
      {results.isError ? (
        <div role="alert">
          {t(
            results.isFetchNextPageError
              ? 'userSearch.moreError'
              : 'userSearch.resultsError',
          )}
        </div>
      ) : null}
      {results.hasNextPage ? (
        <button
          type="button"
          aria-busy={results.isFetchingNextPage || undefined}
          disabled={results.isFetchingNextPage}
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
        </button>
      ) : null}
    </>
  )
}
