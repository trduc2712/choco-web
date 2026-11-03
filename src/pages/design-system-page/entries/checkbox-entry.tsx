import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const NUMBERS = [1, 2, 3]

export function CheckboxEntry() {
  const { t } = useTranslation('designSystem')
  const [checked, setChecked] = useState<number[]>([1])
  const isAllChecked = checked.length === NUMBERS.length

  return (
    <>
      <ShowcaseSection title={t('sections.states')}>
        <Specimen label="unchecked">
          <Checkbox label={t('samples.checkboxLabel')} />
        </Specimen>
        <Specimen label="defaultChecked">
          <Checkbox label={t('samples.checkboxLabel')} defaultChecked />
        </Specimen>
        <Specimen label="hint">
          <Checkbox
            label={t('samples.checkboxLabel')}
            hint={t('samples.checkboxHint')}
          />
        </Specimen>
        <Specimen label="isInvalid">
          <Checkbox label={t('samples.checkboxLabel')} isInvalid />
        </Specimen>
        <Specimen label="disabled">
          <Checkbox label={t('samples.checkboxLabel')} disabled />
        </Specimen>
        <Specimen label="disabled + defaultChecked">
          <Checkbox
            label={t('samples.checkboxLabel')}
            disabled
            defaultChecked
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.indeterminate')}>
        <Specimen label="isIndeterminate">
          <Stack gap={2}>
            <Checkbox
              label={t('samples.selectAll')}
              checked={isAllChecked}
              isIndeterminate={checked.length > 0 && !isAllChecked}
              onChange={() => setChecked(isAllChecked ? [] : NUMBERS)}
            />
            {NUMBERS.map((number) => (
              <Checkbox
                key={number}
                label={t('samples.item', { number })}
                checked={checked.includes(number)}
                onChange={() =>
                  setChecked((current) =>
                    current.includes(number)
                      ? current.filter((value) => value !== number)
                      : [...current, number],
                  )
                }
              />
            ))}
          </Stack>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
