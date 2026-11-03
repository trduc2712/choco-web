import { useTranslation } from 'react-i18next'

import type { AvatarShape, AvatarSize, AvatarStatus } from '@/components'
import { Avatar } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const SHAPES: AvatarShape[] = ['circle', 'square']
const STATUSES: AvatarStatus[] = ['online', 'busy', 'offline']
const SAMPLE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Crect width='8' height='8' fill='%237b42bc'/%3E%3Ccircle cx='4' cy='3' r='1.5' fill='%23f4ecff'/%3E%3Cpath d='M1 8a3 3 0 0 1 6 0z' fill='%23f4ecff'/%3E%3C/svg%3E"
const BROKEN_IMAGE = '/missing-avatar.png'

export function AvatarEntry() {
  const { t } = useTranslation('designSystem')
  const name = t('samples.personName')

  return (
    <>
      <ShowcaseSection title={t('sections.image')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <Avatar name={name} src={SAMPLE_IMAGE} size={size} />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.initials')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <Avatar name={name} size={size} />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.shapes')}>
        <SpecimenRow>
          {SHAPES.map((shape) => (
            <Specimen key={shape} label={shape}>
              <Avatar name={name} shape={shape} size="lg" />
            </Specimen>
          ))}
          {SHAPES.map((shape) => (
            <Specimen key={shape} label={`${shape} / src`}>
              <Avatar name={name} src={SAMPLE_IMAGE} shape={shape} size="lg" />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.status')}>
        <SpecimenRow>
          {STATUSES.map((status) => (
            <Specimen key={status} label={status}>
              <Avatar name={name} status={status} size="lg" />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.fallback')}>
        <Specimen label="src">
          <Avatar name={name} src={BROKEN_IMAGE} />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
