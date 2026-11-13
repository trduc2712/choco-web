import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'

import { NotificationItem } from './notification-item'
import styles from './notifications.module.scss'
import type { AppNotification } from './notifications-api'

function isToday(iso: string, now: Date) {
  const date = new Date(iso)
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

// Today's notifications come first, then the earlier ones, each under a title.
export function NotificationList({
  notifications,
  onOpen,
}: {
  notifications: AppNotification[]
  onOpen: (notification: AppNotification) => void
}) {
  const { t } = useTranslation()
  const now = new Date()
  const today = notifications.filter((item) => isToday(item.createdAt, now))
  const earlier = notifications.filter((item) => !isToday(item.createdAt, now))
  const groups = [
    { id: 'today', title: t('notifications.today'), items: today },
    { id: 'earlier', title: t('notifications.earlier'), items: earlier },
  ].filter((group) => group.items.length > 0)

  return (
    <div role="group" aria-label={t('notifications.title')}>
      {groups.map((group) => (
        <section key={group.id}>
          <Heading level={3} size="md" className={styles.sectionTitle}>
            {group.title}
          </Heading>
          <ul className={styles.list} role="list">
            {group.items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onOpen={onOpen}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
