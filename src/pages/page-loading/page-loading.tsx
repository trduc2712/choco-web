import { useTranslation } from 'react-i18next'

export function PageLoading() {
  const { t } = useTranslation()

  return <p role="status">{t('common.loading')}</p>
}
