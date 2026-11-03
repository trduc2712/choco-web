import { useTranslation } from 'react-i18next'

import { Timeline } from '@/components'

export function TimelineUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Timeline
      label={t('samples.historyLabel')}
      items={[
        {
          id: 'placed',
          title: t('samples.orderPlaced'),
          time: 'Mar 2',
          dateTime: '2026-03-02',
        },
        {
          id: 'shipped',
          title: t('samples.orderShipped'),
          time: 'Mar 3',
          dateTime: '2026-03-03',
          tone: 'success',
          icon: 'truck',
        },
      ]}
    />
  )
}
