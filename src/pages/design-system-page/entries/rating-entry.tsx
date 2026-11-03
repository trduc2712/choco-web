import { useTranslation } from 'react-i18next'

import type { RatingSize } from '@/components'
import { Rating } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const SIZES: RatingSize[] = ['sm', 'md']

export function RatingEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <Rating
                label={t('samples.ratingLabel')}
                defaultValue={3}
                size={size}
              />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.readOnly')}>
        <Specimen label="isReadOnly">
          <Rating label={t('samples.averageRating')} value={4.2} isReadOnly />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
