import { useTranslation } from 'react-i18next'

import type { RadioGroupOrientation } from '@/components'
import { RadioGroup } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const ORIENTATIONS: RadioGroupOrientation[] = ['vertical', 'horizontal']
const NUMBERS = [1, 2, 3]

export function RadioGroupEntry() {
  const { t } = useTranslation('designSystem')
  const options = NUMBERS.map((number) => ({
    value: String(number),
    label: t('samples.option', { number }),
  }))

  return (
    <>
      <ShowcaseSection title={t('sections.orientation')}>
        {ORIENTATIONS.map((orientation) => (
          <Specimen key={orientation} label={orientation}>
            <RadioGroup
              label={t('samples.radioLabel')}
              name={`orientation-${orientation}`}
              options={options}
              orientation={orientation}
              defaultValue="1"
            />
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.validation')}>
        <Specimen label="option hint">
          <RadioGroup
            label={t('samples.radioLabel')}
            name="hints"
            options={options.map((option) => ({
              ...option,
              hint: t('samples.optionHint'),
            }))}
            defaultValue="2"
          />
        </Specimen>
        <Specimen label="error">
          <RadioGroup
            label={t('samples.radioLabel')}
            name="error"
            options={options}
            error={t('samples.fieldError')}
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Specimen label="isDisabled">
          <RadioGroup
            label={t('samples.radioLabel')}
            name="disabled"
            options={options.map((option, index) => ({
              ...option,
              isDisabled: index > 0,
            }))}
            defaultValue="1"
          />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
