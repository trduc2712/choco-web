import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { NOTIFICATIONS_PATH } from '@/constants/routes'
import { cx } from '@/lib/cx'

import styles from './notifications.module.scss'
import { useUnreadCount } from './notifications-api'

export function NotificationsLink({ className }: { className?: string }) {
  const { t } = useTranslation()
  const unread = useUnreadCount().data ?? 0

  return (
    <Link
      to={NOTIFICATIONS_PATH}
      variant="standalone"
      className={cx(styles.navLink, className)}
      aria-label={
        unread > 0
          ? t('notifications.linkUnread', { count: unread })
          : t('notifications.title')
      }
    >
      <Icon name="bell" />
      <Text as="span" size="sm" weight="semibold" className={styles.navText}>
        {t('notifications.title')}
      </Text>
      {unread > 0 ? (
        <Badge tone="primary" variant="solid" count={unread} />
      ) : null}
    </Link>
  )
}
