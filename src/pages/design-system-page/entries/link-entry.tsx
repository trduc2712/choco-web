import { useTranslation } from 'react-i18next'

import type { LinkVariant } from '@/components'
import { Link, Text } from '@/components'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const EXTERNAL_LINK = 'https://www.w3.org/TR/WCAG21/'
const VARIANTS: LinkVariant[] = ['inline', 'standalone', 'subtle']

export function LinkEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.variants')}>
        <SpecimenRow>
          {VARIANTS.map((variant) => (
            <Specimen key={variant} label={variant}>
              <Link to={DESIGN_SYSTEM_PATH} variant={variant}>
                {t('samples.internalLink')}
              </Link>
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.internal')}>
        <Text>
          {t('samples.body')}{' '}
          <Link to={DESIGN_SYSTEM_PATH}>{t('samples.internalLink')}</Link>
        </Text>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.external')}>
        <SpecimenRow>
          {VARIANTS.map((variant) => (
            <Specimen key={variant} label={variant}>
              <Link href={EXTERNAL_LINK} variant={variant}>
                {t('samples.externalLink')}
              </Link>
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
    </>
  )
}
