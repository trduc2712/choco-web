import { useTranslation } from 'react-i18next'

import type { AvatarSize } from '@/components'
import { AvatarGroup } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg']
const PEOPLE = [1, 2, 3, 4, 5, 6].map((number) => ({
  id: `identity-id-${number}`,
  name: `Display Name ${number}`,
}))

export function AvatarGroupEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <AvatarGroup
                label={t('samples.teamLabel')}
                people={PEOPLE}
                size={size}
              />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.count')}>
        <SpecimenRow>
          <Specimen label="max 3">
            <AvatarGroup
              label={t('samples.teamLabel')}
              people={PEOPLE}
              max={3}
            />
          </Specimen>
          <Specimen label="fits">
            <AvatarGroup
              label={t('samples.teamLabel')}
              people={PEOPLE.slice(0, 3)}
            />
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
    </>
  )
}
