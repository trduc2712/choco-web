import { useTranslation } from 'react-i18next'

import type { TextAlign, TextSize, TextTone, TextWeight } from '@/components'
import { Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const SIZES: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const WEIGHTS: TextWeight[] = ['regular', 'medium', 'semibold']
const TONES: TextTone[] = [
  'default',
  'muted',
  'primary',
  'info',
  'success',
  'warning',
  'danger',
]
const ALIGNS: TextAlign[] = ['start', 'center', 'end']

export function TextEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        {SIZES.map((size) => (
          <Specimen key={size} label={size}>
            <Text size={size}>{t('samples.body')}</Text>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.weights')}>
        {WEIGHTS.map((weight) => (
          <Specimen key={weight} label={weight}>
            <Text weight={weight}>{t('samples.body')}</Text>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.tones')}>
        {TONES.map((tone) => (
          <Specimen key={tone} label={tone}>
            <Text tone={tone}>{t('samples.body')}</Text>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.alignment')}>
        {ALIGNS.map((align) => (
          <Specimen key={align} label={align} isStretched>
            <Text align={align}>{t('samples.body')}</Text>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.truncation')}>
        <Specimen label="isTruncated">
          <Text className={styles.truncated} isTruncated>
            {t('samples.longBody')}
          </Text>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
