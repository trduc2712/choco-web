import { useTranslation } from 'react-i18next'

import { Alert } from '@/components'

export function AlertUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Alert tone="success" title={t('samples.toastTitle')}>
      {t('samples.toastBody')}
    </Alert>
  )
}
