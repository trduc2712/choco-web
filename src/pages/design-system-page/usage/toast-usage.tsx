import { useTranslation } from 'react-i18next'

import { Button, useToast } from '@/components'

export function ToastUsage() {
  const { t } = useTranslation('designSystem')
  const { showToast } = useToast()

  return (
    <Button
      onClick={() =>
        showToast({
          tone: 'success',
          title: t('samples.toastTitle'),
          description: t('samples.toastBody'),
        })
      }
    >
      {t('samples.showToast')}
    </Button>
  )
}
