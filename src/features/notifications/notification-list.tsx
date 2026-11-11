import { useTranslation } from 'react-i18next'

import { NotificationItem } from './notification-item'
import styles from './notifications.module.scss'
import type { AppNotification } from './notifications-api'

export function NotificationList({
  notifications,
  onOpen,
}: {
  notifications: AppNotification[]
  onOpen: (notification: AppNotification) => void
}) {
  const { t } = useTranslation()

  return (
    <ul
      className={styles.list}
      role="list"
      aria-label={t('notifications.title')}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onOpen={onOpen}
        />
      ))}
    </ul>
  )
}
