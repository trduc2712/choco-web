import { useTranslation } from 'react-i18next'

import type { SpinnerSize, SpinnerTone } from '@/components'
import { Spinner } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const SIZES: SpinnerSize[] = ['sm', 'md', 'lg']
const TONES: SpinnerTone[] = ['current', 'primary', 'muted']

export function SpinnerEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <Spinner size={size} />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.tones')}>
        <SpecimenRow>
          {TONES.map((tone) => (
            <Specimen key={tone} label={tone}>
              <Spinner tone={tone} />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.customLabel')}>
        <Specimen label="label">
          <Spinner label={t('samples.saving')} />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
