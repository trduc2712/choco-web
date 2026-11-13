import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Spinner } from '@/components/spinner/spinner'
import { Text } from '@/components/text/text'
import { useSuspension } from '@/features/current-user'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { NotificationList } from './notification-list'
import styles from './notifications.module.scss'
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
    return (
      <div role="status" className={styles.status}>
        <Spinner tone="primary" isDecorative />
        <Text size="sm" tone="muted">
          {t('notifications.loading')}
        </Text>
      </div>
    )
  }

  if (!query.data) {
    return (
      <EmptyState
        size="sm"
        role="alert"
        icon="bell"
        title={t('notifications.loadError')}
        action={
          <Button
            variant="secondary"
            isLoading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('common.retry')}
          </Button>
        }
      />
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
        <EmptyState
          size="sm"
          icon="bell"
          title={t(
            unreadOnly ? 'notifications.noUnread' : 'notifications.empty',
          )}
          description={t(
            unreadOnly
              ? 'notifications.noUnreadHint'
              : 'notifications.emptyHint',
          )}
        />
      )}
      {limit === undefined && query.isError && query.isFetchNextPageError ? (
        <Alert tone="danger" role="alert">
          {t('notifications.loadMoreError')}
        </Alert>
      ) : null}
      {limit === undefined && !query.hasNextPage && items.length > 0 ? (
        <Text size="sm" tone="muted" align="center" className={styles.endNote}>
          {t('notifications.endOfList')}
        </Text>
      ) : null}
      {canLoadMore ? (
        <div ref={sentinelRef} className={styles.loadMore}>
          {isAutomatic && !query.isFetchNextPageError ? (
            query.isFetchingNextPage ? (
              <Spinner tone="primary" isDecorative />
            ) : null
          ) : (
            <Button
              variant="secondary"
              disabled={query.isFetching && !query.isFetchingNextPage}
              isLoading={query.isFetchingNextPage}
              onClick={loadMore}
            >
              {t(
                query.isFetchNextPageError
                  ? 'common.retry'
                  : 'notifications.loadMore',
              )}
            </Button>
          )}
        </div>
      ) : null}
    </>
  )
}
