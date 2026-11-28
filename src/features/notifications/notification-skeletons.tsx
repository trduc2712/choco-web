import { useTranslation } from 'react-i18next'

export function NotificationSkeletons() {
  const { t } = useTranslation()
  return <span role="status">{t('notifications.loading')}</span>
}
