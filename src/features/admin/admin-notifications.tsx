import { useTranslation } from 'react-i18next'

import { Popover } from '@/components/popover/popover'

// The admin's own bell: events that need an administrator, such as new
// feedback or a new report. It is not the personal notifications of the
// account. No source feeds it yet, so it always shows the empty state.
export function AdminNotifications() {
  const { t } = useTranslation()

  return (
    <Popover
      placement="bottom-end"
      title={t('admin.notifications.title')}
      trigger={
        <button type="button" aria-label={t('admin.notifications.title')}>
          {t('admin.notifications.title')}
        </button>
      }
    >
      <section role="status">
        <h2>{t('admin.notifications.empty')}</h2>
        <p>{t('admin.notifications.emptyHint')}</p>
      </section>
    </Popover>
  )
}
