import { useTranslation } from 'react-i18next'

import { MessageBox } from '@/components'

export function MessageBoxUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <MessageBox lines={2} meta={t('samples.muted')}>
      {t('samples.longBody')}
    </MessageBox>
  )
}
