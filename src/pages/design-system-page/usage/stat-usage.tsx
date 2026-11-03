import { useTranslation } from 'react-i18next'

import { Stat } from '@/components'

export function StatUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Stat
      label={t('samples.revenue')}
      value="$12,400"
      change="+8%"
      changeLabel={t('samples.vsLastMonth')}
      trend="up"
    />
  )
}
