import type { MouseEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { Icon } from '@/components/icon/icon'
import { Popover } from '@/components/popover/popover'
import { Tabs } from '@/components/tabs/tabs'
import { Tooltip } from '@/components/tooltip/tooltip'
import { useSuspension } from '@/features/current-user'

import styles from './notifications.module.scss'
import { useUnreadCount } from './notifications-api'
import { NotificationsContent } from './notifications-content'
import { useMarkAllNotificationsRead } from './use-mark-notifications-read'

// How many notifications the dropdown shows before "See all".
const PREVIEW_COUNT = 5

// The header bell. It opens the latest notifications in a dropdown, and the
// full page stays one link away.
export function NotificationsMenu() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  // The dropdown starts as a short preview; "See all" turns it into the full,
  // scrolling list.
  const [isExpanded, setIsExpanded] = useState(false)
  const unread = useUnreadCount().data ?? 0
  const markAll = useMarkAllNotificationsRead()
  const { isSuspended } = useSuspension()

  // Following a notification leaves the dropdown.
  function closeOnNavigate(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('a')) setIsOpen(false)
  }

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) setIsExpanded(false)
      }}
      label={t('notifications.title')}
      placement="bottom-end"
      className={styles.menuPanel}
      trigger={
        <button
          type="button"
          className={styles.iconLink}
          aria-label={
            unread > 0
              ? t('notifications.linkUnread', { count: unread })
              : t('notifications.title')
          }
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
      }
    >
      {/* Clicks only bubble up from links; keyboard follows via the link's own click. */}
      <div className={styles.menuBody} onClick={closeOnNavigate}>
        <div className={styles.menuHeader}>
          <h2 className={styles.menuTitle}>{t('notifications.title')}</h2>
          <Tooltip content={t('notifications.markAllRead')}>
            <Button
              icon="check-check"
              variant="ghost"
              size="sm"
              aria-label={t('notifications.markAllRead')}
              disabled={unread === 0 || isSuspended}
              onClick={() => markAll.mutate()}
            />
          </Tooltip>
        </div>
        <Tabs
          label={t('notifications.filter')}
          className={styles.menuTabs}
          variant="chip"
          items={[
            {
              id: 'all',
              label: t('notifications.all'),
              content: (
                <NotificationsContent
                  unreadOnly={false}
                  limit={isExpanded ? undefined : PREVIEW_COUNT}
                />
              ),
            },
            {
              id: 'unread',
              label: t('notifications.unreadTab'),
              content: (
                <NotificationsContent
                  unreadOnly
                  limit={isExpanded ? undefined : PREVIEW_COUNT}
                />
              ),
            },
          ]}
        />
        {isExpanded ? null : (
          <div className={styles.menuFooter}>
            <Button
              variant="secondary"
              isFullWidth
              onClick={() => setIsExpanded(true)}
            >
              {t('notifications.seeAll')}
            </Button>
          </div>
        )}
      </div>
    </Popover>
  )
}
