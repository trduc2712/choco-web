import { useTranslation } from 'react-i18next'

import type { DateRangePreset } from '@/components'
import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  Stack,
} from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

function daysAgo(days: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - days)

  return date
}

function isWeekend(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6
}

export function DatePickerEntry() {
  const { t } = useTranslation('designSystem')
  const today = daysAgo(0)
  const presets: DateRangePreset[] = [
    {
      id: 'last-7-days',
      label: t('samples.last7Days'),
      range: { start: daysAgo(6), end: today },
    },
    {
      id: 'last-30-days',
      label: t('samples.last30Days'),
      range: { start: daysAgo(29), end: today },
    },
    {
      id: 'this-month',
      label: t('samples.thisMonth'),
      range: {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today,
      },
    },
  ]

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="type or pick" isStretched>
            <DatePicker
              label={t('samples.dueDateLabel')}
              hint={t('samples.datePickerHint')}
            />
          </Specimen>
          <Specimen label="min + isDateDisabled" isStretched>
            <DatePicker
              label={t('samples.dueDateLabel')}
              min={today}
              isDateDisabled={isWeekend}
              hint={t('samples.weekdaysOnly')}
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="error" isStretched>
            <DatePicker
              label={t('samples.dueDateLabel')}
              error={t('samples.fieldError')}
              isRequired
            />
          </Specimen>
          <Specimen label="isReadOnly" isStretched>
            <DatePicker
              label={t('samples.dueDateLabel')}
              defaultValue={today}
              isReadOnly
            />
          </Specimen>
          <Specimen label="isDisabled" isStretched>
            <DatePicker label={t('samples.dueDateLabel')} isDisabled />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withTime')}>
        <Specimen label="DateTimePicker" isStretched>
          <div className={styles.narrow}>
            <DateTimePicker
              label={t('samples.startsAtLabel')}
              defaultTime="09:00"
              timeStep={30}
            />
          </div>
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.dateRange')}>
        <Specimen label="presets + two months" isStretched>
          <div className={styles.narrow}>
            <DateRangePicker
              label={t('samples.stayLabel')}
              presets={presets}
              max={today}
            />
          </div>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
