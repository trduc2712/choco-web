import { useTranslation } from 'react-i18next'

import type { BadgeSize, BadgeTone, BadgeVariant } from '@/components'
import { Badge } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const TONES: BadgeTone[] = [
  'neutral',
  'primary',
  'info',
  'success',
  'warning',
  'danger',
]
const VARIANTS: BadgeVariant[] = ['subtle', 'solid', 'outline']
const SIZES: BadgeSize[] = ['sm', 'md']

export function BadgeEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.variants')}>
        {VARIANTS.map((variant) => (
          <SpecimenRow key={variant}>
            {TONES.map((tone) => (
              <Specimen key={tone} label={`${variant} / ${tone}`}>
                <Badge variant={variant} tone={tone}>
                  {t('samples.badge')}
                </Badge>
              </Specimen>
            ))}
          </SpecimenRow>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.sizes')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <Badge tone="primary" size={size}>
                {t('samples.badge')}
              </Badge>
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withIcons')}>
        <SpecimenRow>
          <Specimen label="icon">
            <Badge tone="success" icon="check">
              {t('samples.badge')}
            </Badge>
          </Specimen>
          <Specimen label="icon / solid">
            <Badge tone="danger" variant="solid" icon="alert-circle" size="md">
              {t('samples.badge')}
            </Badge>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.count')}>
        <SpecimenRow>
          <Specimen label="count={7}">
            <Badge tone="primary" variant="solid" count={7} />
          </Specimen>
          <Specimen label="count={128}">
            <Badge tone="danger" variant="solid" count={128} />
          </Specimen>
          <Specimen label="count={128} max={999}">
            <Badge tone="danger" count={128} max={999} />
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
    </>
  )
}
