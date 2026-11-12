import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Spinner } from '@/components/spinner/spinner'
import { Text } from '@/components/text/text'
import { useSuspension } from '@/features/current-user'

import { NotificationList } from './notification-list'
import styles from './notifications.module.scss'
import { useNotifications } from './notifications-api'
import { useMarkNotificationRead } from './use-mark-notifications-read'

export function NotificationsContent({ unreadOnly }: { unreadOnly: boolean }) {
  const { t } = useTranslation()
  const query = useNotifications()
  const markRead = useMarkNotificationRead()
  const { isSuspended } = useSuspension()

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
  const items = unreadOnly ? all.filter((item) => !item.isRead) : all

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
      ) : query.hasNextPage ? null : (
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
      {query.isError && query.isFetchNextPageError ? (
        <Alert tone="danger" role="alert">
          {t('notifications.loadMoreError')}
        </Alert>
      ) : null}
      {query.hasNextPage ? (
        <div className={styles.loadMore}>
          <Button
            variant="secondary"
            disabled={query.isFetching && !query.isFetchingNextPage}
            isLoading={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage({ cancelRefetch: false })}
          >
            {t(
              query.isFetchNextPageError
                ? 'common.retry'
                : 'notifications.loadMore',
            )}
          </Button>
        </div>
      ) : null}
    </>
  )
}
