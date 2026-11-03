import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { TagTone } from '@/components'
import { Stack, Tag } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const TONES: TagTone[] = ['neutral', 'primary']
const NUMBERS = [1, 2, 3, 4]

export function TagEntry() {
  const { t } = useTranslation('designSystem')
  const [numbers, setNumbers] = useState(NUMBERS)

  return (
    <>
      <ShowcaseSection title={t('sections.tones')}>
        <SpecimenRow>
          {TONES.map((tone) => (
            <Specimen key={tone} label={tone}>
              <Tag label={t('samples.tag')} tone={tone} />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withIcons')}>
        <Specimen label="icon">
          <Tag label={t('samples.tag')} icon="hash" />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.removable')}>
        <Specimen label="onRemove">
          <Stack direction="row" gap={2} isWrapping>
            {numbers.map((number) => (
              <Tag
                key={number}
                label={t('samples.item', { number })}
                tone="primary"
                onRemove={() =>
                  setNumbers((current) =>
                    current.filter((value) => value !== number),
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
