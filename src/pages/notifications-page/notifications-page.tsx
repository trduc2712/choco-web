import { NotificationsScreen } from '@/features/notifications'

import styles from './notifications-page.module.scss'

export function NotificationsPage() {
  return (
    <section className={styles.page}>
      <NotificationsScreen />
    </section>
  )
}
