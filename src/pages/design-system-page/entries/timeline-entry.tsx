import { useTranslation } from 'react-i18next'

import type { TimelineItem } from '@/components'
import { Timeline } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const EVENTS = [
  { id: 'placed', key: 'orderPlaced', date: '2026-01-01T00:00:00Z' },
  { id: 'packed', key: 'orderPacked', date: '2026-01-01T06:00:00Z' },
  { id: 'shipped', key: 'orderShipped', date: '2026-01-02T00:00:00Z' },
  { id: 'delivered', key: 'orderDelivered', date: '2026-01-03T00:00:00Z' },
] as const

const timeFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function TimelineEntry() {
  const { t } = useTranslation('designSystem')
  const items: TimelineItem[] = EVENTS.map((event, index) => ({
    id: event.id,
    title: t(`samples.${event.key}`),
    time: timeFormat.format(new Date(event.date)),
    dateTime: event.date,
    description:
      event.id === 'shipped' ? t('samples.orderShippedBody') : undefined,
    tone: index === EVENTS.length - 1 ? 'success' : 'primary',
    icon: index === EVENTS.length - 1 ? 'check' : undefined,
  }))

  return (
    <ShowcaseSection title={t('sections.default')}>
      <Specimen label="items" isStretched>
        <div className={styles.narrow}>
          <Timeline label={t('samples.historyLabel')} items={items} />
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
