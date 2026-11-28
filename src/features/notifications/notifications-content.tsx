import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { useSuspension } from '@/features/current-user'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { NotificationList } from './notification-list'
import { NotificationSkeletons } from './notification-skeletons'
import { useNotifications } from './notifications-api'
import { useMarkNotificationRead } from './use-mark-notifications-read'

type NotificationsContentProps = {
  unreadOnly: boolean
  // Shows only the first few, with no way to load more: the dropdown's short
  // preview. Without it the list is complete and keeps loading as it scrolls.
  limit?: number
}

export function NotificationsContent({
  unreadOnly,
  limit,
}: NotificationsContentProps) {
  const { t } = useTranslation()
  const query = useNotifications()
  const markRead = useMarkNotificationRead()
  const { isSuspended } = useSuspension()
  const { fetchNextPage } = query
  const loadMore = useCallback(
    () => void fetchNextPage({ cancelRefetch: false }),
    [fetchNextPage],
  )
  const { sentinelRef, isAutomatic } = useInfiniteScroll({
    hasNextPage: limit === undefined && query.hasNextPage,
    isFetching: query.isFetching,
    isPaused: query.isFetchNextPageError,
    onLoadMore: loadMore,
  })

  if (query.isPending) {
    return <NotificationSkeletons />
  }

  if (!query.data) {
    return (
      <section role="alert">
        <h2>{t('notifications.loadError')}</h2>
        {
          <button
            type="button"
            aria-busy={query.isFetching || undefined}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('common.retry')}
          </button>
        }
      </section>
    )
  }

  const all = query.data.pages.flatMap((page) => page.items)
  const filtered = unreadOnly ? all.filter((item) => !item.isRead) : all
  const items = limit === undefined ? filtered : filtered.slice(0, limit)
  const canLoadMore = limit === undefined && query.hasNextPage

  return (
    <>
      {items.length > 0 ? (
        <NotificationList
          notifications={items}
          onOpen={(notification) => {
            if (!notification.isRead && !isSuspended) {
              markRead(notification.id)
            }
          }}
        />
      ) : canLoadMore ? null : (
        <section>
          <h2>
            {t(unreadOnly ? 'notifications.noUnread' : 'notifications.empty')}
          </h2>
          <p>
            {t(
              unreadOnly
                ? 'notifications.noUnreadHint'
                : 'notifications.emptyHint',
            )}
          </p>
        </section>
      )}
      {limit === undefined && query.isError && query.isFetchNextPageError ? (
        <div role="alert">{t('notifications.loadMoreError')}</div>
      ) : null}
      {limit === undefined && !query.hasNextPage && items.length > 0 ? (
        <p>{t('notifications.endOfList')}</p>
      ) : null}
      {canLoadMore ? (
        <div
          ref={sentinelRef}
          className={
            isAutomatic && !query.isFetchNextPageError
              ? undefined
              : 'notifications-loadMore'
          }
        >
          {isAutomatic && !query.isFetchNextPageError ? (
            // The next page loads in as more notification placeholders.
            query.isFetchingNextPage ? (
              <NotificationSkeletons />
            ) : null
          ) : (
            <button
              type="button"
              aria-busy={query.isFetchingNextPage || undefined}
              disabled={
                (query.isFetching && !query.isFetchingNextPage) ||
                query.isFetchingNextPage
              }
              onClick={loadMore}
            >
              {t(
                query.isFetchNextPageError
                  ? 'common.retry'
                  : 'notifications.loadMore',
              )}
            </button>
          )}
        </div>
      ) : null}
    </>
  )
}
