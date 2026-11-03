import { useTranslation } from 'react-i18next'

import type { HeadingAlign, HeadingSize, HeadingTone } from '@/components'
import { Heading } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const LEVELS = [3, 4, 5, 6] as const
const SIZES: HeadingSize[] = ['3xl', '2xl', 'xl', 'lg', 'md', 'sm']
const TONES: HeadingTone[] = ['default', 'muted']
const ALIGNS: HeadingAlign[] = ['start', 'center', 'end']

export function HeadingEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.levels')}>
        {LEVELS.map((level) => (
          <Specimen key={level} label={`level={${level}}`}>
            <Heading level={level}>{t('samples.heading')}</Heading>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.sizes')}>
        {SIZES.map((size) => (
          <Specimen key={size} label={size}>
            <Heading level={3} size={size}>
              {t('samples.heading')}
            </Heading>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.tones')}>
        {TONES.map((tone) => (
          <Specimen key={tone} label={tone}>
            <Heading level={3} size="lg" tone={tone}>
              {t('samples.heading')}
            </Heading>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.alignment')}>
        {ALIGNS.map((align) => (
          <Specimen key={align} label={align} isStretched>
            <Heading level={3} size="lg" align={align}>
              {t('samples.heading')}
            </Heading>
          </Specimen>
        ))}
      </ShowcaseSection>
    </>
  )
}
