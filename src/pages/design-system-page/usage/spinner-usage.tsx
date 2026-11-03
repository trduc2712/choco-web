import { useTranslation } from 'react-i18next'

import { Spinner } from '@/components'

export function SpinnerUsage() {
  const { t } = useTranslation('designSystem')

  return <Spinner size="lg" tone="primary" label={t('samples.saving')} />
}
