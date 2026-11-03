import { useTranslation } from 'react-i18next'

import { NumberInput, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function NumberInputEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="min 1, max 99" isStretched>
            <NumberInput
              label={t('samples.quantityLabel')}
              defaultValue={1}
              min={1}
              max={99}
            />
          </Specimen>
          <Specimen label="step 0.5" isStretched>
            <NumberInput
              label={t('samples.weightLabel')}
              defaultValue={2.5}
              min={0}
              step={0.5}
              hint={t('samples.fieldHint')}
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withFormatting')}>
        <Specimen label="currency" isStretched>
          <div className={styles.narrow}>
            <NumberInput
              label={t('samples.colTotal')}
              defaultValue={1250}
              min={0}
              step={50}
              formatOptions={{ style: 'currency', currency: 'USD' }}
            />
          </div>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
