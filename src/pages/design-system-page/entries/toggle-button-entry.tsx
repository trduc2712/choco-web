import { useTranslation } from 'react-i18next'

import type { ToggleButtonSize } from '@/components'
import { ToggleButton } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const SIZES: ToggleButtonSize[] = ['sm', 'md']

export function ToggleButtonEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <ToggleButton icon="star" size={size}>
                {t('samples.favorite')}
              </ToggleButton>
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <SpecimenRow>
          <Specimen label="pressed">
            <ToggleButton icon="star" defaultPressed>
              {t('samples.favorite')}
            </ToggleButton>
          </Specimen>
          <Specimen label="icon only">
            <ToggleButton icon="bold" aria-label={t('samples.bold')} />
          </Specimen>
          <Specimen label="disabled">
            <ToggleButton icon="star" disabled>
              {t('samples.favorite')}
            </ToggleButton>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
    </>
  )
}
