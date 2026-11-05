import { useTranslation } from 'react-i18next'

import { Grid, Stat } from '@/components'

import { ShowcaseSection } from '../showcase-section'

export function StatEntry() {
  const { t, i18n } = useTranslation('designSystem')
  const currency = new Intl.NumberFormat(i18n.resolvedLanguage, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  return (
    <ShowcaseSection title={t('sections.trends')}>
      <Grid columns={3} gap={5}>
        <Stat
          label={t('samples.revenue')}
          value={currency.format(12400)}
          change="+8%"
          changeLabel={t('samples.vsLastMonth')}
          trend="up"
          icon="dollar"
        />
        <Stat
          label={t('samples.ordersCount')}
          value="312"
          change="−3%"
          changeLabel={t('samples.vsLastMonth')}
          trend="down"
          icon="package"
        />
        <Stat
          label={t('samples.refunds')}
          value="4"
          change="+2"
          changeLabel={t('samples.vsLastMonth')}
          trend="up"
          isTrendPositive={false}
          icon="receipt"
        />
      </Grid>
    </ShowcaseSection>
  )
}
