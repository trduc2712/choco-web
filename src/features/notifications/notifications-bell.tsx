import type { ComponentPropsWithRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Icon } from '@/components/icon/icon'
import { cx } from '@/lib/cx'

import styles from './notifications.module.scss'

type NotificationsBellProps = ComponentPropsWithRef<'button'> & {
  // Unread notifications; above zero they show as a badge on the bell.
  unread?: number
}

// The round bell button of the header. NotificationsMenu opens its dropdown
// from it; a Popover trigger's aria and click props pass through to the button.
export function NotificationsBell({
  unread = 0,
  className,
  ...props
}: NotificationsBellProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      className={cx(styles.iconLink, className)}
      aria-label={
        unread > 0
          ? t('notifications.linkUnread', { count: unread })
          : t('notifications.title')
      }
      {...props}
    >
      <Icon name="bell" />
      {unread > 0 ? (
        <Badge
          tone="primary"
          variant="solid"
          count={unread}
          className={styles.iconLinkBadge}
        />
      ) : null}
    </button>
  )
}
