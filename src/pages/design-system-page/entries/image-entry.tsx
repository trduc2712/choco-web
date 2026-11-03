import { useTranslation } from 'react-i18next'

import { Image } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'
import styles from './entries.module.scss'
import { SAMPLE_IMAGE } from './sample-image'

export function ImageEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.ratios')}>
        <SpecimenRow>
          {[1, 4 / 3, 16 / 9].map((ratio) => (
            <Specimen key={ratio} label={`ratio ${ratio.toFixed(2)}`}>
              <div className={styles.imageFrame}>
                <Image
                  src={SAMPLE_IMAGE}
                  alt={t('samples.imageAlt')}
                  ratio={ratio}
                  isRounded
                />
              </div>
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.fallback')}>
        <Specimen label="onError">
          <div className={styles.imageFrame}>
            <Image
              src="/missing-image.png"
              alt={t('samples.brokenImageAlt')}
              ratio={4 / 3}
              isRounded
            />
          </div>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
