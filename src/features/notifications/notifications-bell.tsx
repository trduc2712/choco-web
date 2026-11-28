import type { ComponentPropsWithRef } from 'react'
import { useTranslation } from 'react-i18next'

import { cx } from '@/lib/cx'

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
      className={cx('notifications-iconLink', className)}
      aria-label={
        unread > 0
          ? t('notifications.linkUnread', { count: unread })
          : t('notifications.title')
      }
      {...props}
    >
      <span aria-hidden="true">🔔</span>
      {unread > 0 ? (
        <span>{unread > 99 ? t('badge.overflow', { max: 99 }) : unread}</span>
      ) : null}
    </button>
  )
}
