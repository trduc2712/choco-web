import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { DateRange } from '@/components'
import { Calendar } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

function isWeekend(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6
}

export function CalendarEntry() {
  const { t } = useTranslation('designSystem')
  const [date, setDate] = useState<Date | null>(() => new Date())
  const [range, setRange] = useState<DateRange | null>(null)

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <SpecimenRow>
          <Specimen label="single">
            <Calendar value={date} onChange={setDate} />
          </Specimen>
          <Specimen label="isDateDisabled: weekends">
            <Calendar isDateDisabled={isWeekend} />
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.weekNumbers')}>
        <Specimen label="hasWeekNumbers">
          <Calendar weekStartsOn={1} hasWeekNumbers />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.dateRange')}>
        <Specimen label="mode range">
          <Calendar mode="range" value={range} onChange={setRange} />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
