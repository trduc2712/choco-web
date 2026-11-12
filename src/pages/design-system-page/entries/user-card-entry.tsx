import { useTranslation } from 'react-i18next'

import type { AvatarShape, AvatarSize } from '@/components'
import { Icon, UserCard } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const SIZES: AvatarSize[] = ['sm', 'md', 'lg']
const SHAPES: AvatarShape[] = ['circle', 'square']

export function UserCardEntry() {
  const { t } = useTranslation('designSystem')
  const name = t('samples.personName')
  const username = t('samples.username')

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <UserCard name={name} description={username} size={size} />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.shapes')}>
        <SpecimenRow>
          {SHAPES.map((shape) => (
            <Specimen key={shape} label={shape}>
              <UserCard name={name} description={username} shape={shape} />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.truncation')}>
        <SpecimenRow>
          <Specimen label="isTruncated">
            <div style={{ width: '10rem' }}>
              <UserCard
                name={t('samples.longBody')}
                description={t('samples.longBody')}
                isTruncated
              />
            </div>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withTrailing')}>
        <SpecimenRow>
          <Specimen label="trailing">
            <UserCard
              name={name}
              description={username}
              trailing={<Icon name="chevron-up-down" size="sm" />}
            />
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
    </>
  )
}
