import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Popover } from '@/components/popover/popover'

import styles from './admin-notifications.module.scss'

// The admin's own bell: events that need an administrator, such as new
// feedback or a new report. It is not the personal notifications of the
// account. No source feeds it yet, so it always shows the empty state.
export function AdminNotifications() {
  const { t } = useTranslation()

  return (
    <Popover
      className={styles.panel}
      placement="bottom-end"
      title={t('admin.notifications.title')}
      trigger={
        <Button
          className={styles.trigger}
          variant="ghost"
          size="sm"
          shape="pill"
          icon="bell"
          aria-label={t('admin.notifications.title')}
        />
      }
    >
      <EmptyState
        size="sm"
        role="status"
        icon="bell-off"
        title={t('admin.notifications.empty')}
        description={t('admin.notifications.emptyHint')}
      />
    </Popover>
  )
}
