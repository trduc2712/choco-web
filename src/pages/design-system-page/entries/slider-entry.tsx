import { useTranslation } from 'react-i18next'

import { RangeSlider, Slider, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const formatPrice = (value: number) => `$${value}`

export function SliderEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="Slider" isStretched>
            <Slider
              label={t('samples.volumeLabel')}
              defaultValue={60}
              formatValue={(value) => `${value}%`}
              hint={t('samples.fieldHint')}
            />
          </Specimen>
          <Specimen label="isDisabled" isStretched>
            <Slider
              label={t('samples.volumeLabel')}
              defaultValue={30}
              isDisabled
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.range')}>
        <Specimen label="RangeSlider" isStretched>
          <div className={styles.narrow}>
            <RangeSlider
              label={t('samples.priceLabel')}
              min={0}
              max={200}
              step={5}
              defaultValue={[20, 120]}
              formatValue={formatPrice}
              thumbLabels={[t('samples.minPrice'), t('samples.maxPrice')]}
            />
          </div>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
