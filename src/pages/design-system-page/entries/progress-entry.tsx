import { useTranslation } from 'react-i18next'

import type { ProgressTone } from '@/components'
import { Progress, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const TONES: ProgressTone[] = ['primary', 'success', 'danger']
const VALUES = [0, 25, 60, 100]

export function ProgressEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.tones')}>
        <Stack gap={5} className={styles.narrow}>
          {TONES.map((tone) => (
            <Specimen key={tone} label={tone} isStretched>
              <Progress
                label={t('samples.progressLabel')}
                value={60}
                tone={tone}
                isValueShown
              />
            </Specimen>
          ))}
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Stack gap={5} className={styles.narrow}>
          {VALUES.map((value) => (
            <Specimen key={value} label={`value={${value}}`} isStretched>
              <Progress
                label={t('samples.progressLabel')}
                value={value}
                isValueShown
              />
            </Specimen>
          ))}
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.indeterminate')}>
        <div className={styles.narrow}>
          <Specimen label="value={undefined}" isStretched>
            <Progress label={t('samples.saving')} />
          </Specimen>
        </div>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.hiddenLabel')}>
        <div className={styles.narrow}>
          <Specimen label="isLabelHidden" isStretched>
            <Progress
              label={t('samples.progressLabel')}
              value={40}
              isLabelHidden
            />
          </Specimen>
        </div>
      </ShowcaseSection>
    </>
  )
}
