import { useTranslation } from 'react-i18next'

import { Stack, TimeField } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function TimeFieldEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.default')}>
      <Stack gap={5} className={styles.narrow}>
        <Specimen label="step 15" isStretched>
          <TimeField
            label={t('samples.timeLabel')}
            hint={t('samples.timeHint')}
          />
        </Specimen>
        <Specimen label="min + max" isStretched>
          <TimeField
            label={t('samples.timeLabel')}
            defaultValue="09:00"
            min="09:00"
            max="17:00"
            step={30}
          />
        </Specimen>
        <Specimen label="error" isStretched>
          <TimeField
            label={t('samples.timeLabel')}
            error={t('samples.fieldError')}
          />
        </Specimen>
      </Stack>
    </ShowcaseSection>
  )
}
