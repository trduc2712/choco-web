import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Tabs } from '@/components/tabs/tabs'
import { HOME_PATH } from '@/constants/routes'
import { ProfileToolbar } from '@/features/profile'

import styles from './notifications.module.scss'
import { useUnreadCount } from './notifications-api'
import { NotificationsContent } from './notifications-content'
import { useMarkAllNotificationsRead } from './use-mark-notifications-read'

export function NotificationsScreen() {
  const { t } = useTranslation()
  const unreadCount = useUnreadCount().data ?? 0
  const markAll = useMarkAllNotificationsRead()

  return (
    <>
      <ProfileToolbar
        to={HOME_PATH}
        backLabel={t('postDetail.back')}
        isHeading
        title={t('notifications.title')}
        action={
          <Button
            variant="ghost"
            size="sm"
            iconStart="check-check"
            disabled={unreadCount === 0}
            onClick={() => markAll.mutate()}
          >
            <span className={styles.markAllText}>
              {t('notifications.markAllRead')}
            </span>
          </Button>
        }
      />
      <Tabs
        label={t('notifications.filter')}
        className={styles.tabs}
        items={[
          {
            id: 'all',
            label: t('notifications.all'),
            content: <NotificationsContent unreadOnly={false} />,
          },
          {
            id: 'unread',
            label: t('notifications.unreadTab'),
            content: <NotificationsContent unreadOnly />,
          },
        ]}
      />
    </>
  )
}
