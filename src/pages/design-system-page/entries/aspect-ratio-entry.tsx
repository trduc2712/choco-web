import { useTranslation } from 'react-i18next'

import { AspectRatio } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'
import styles from './entries.module.scss'

const RATIOS = [
  { label: '1 / 1', value: 1 },
  { label: '4 / 3', value: 4 / 3 },
  { label: '16 / 9', value: 16 / 9 },
]

export function AspectRatioEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.ratios')}>
      <SpecimenRow>
        {RATIOS.map((ratio) => (
          <Specimen key={ratio.label} label={ratio.label}>
            <div className={styles.imageFrame}>
              <AspectRatio ratio={ratio.value} className={styles.ratioBox} />
            </div>
          </Specimen>
        ))}
      </SpecimenRow>
    </ShowcaseSection>
  )
}
