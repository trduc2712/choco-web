import { useTranslation } from 'react-i18next'

import { Stack, Textarea } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function TextareaEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <div className={styles.narrow}>
          <Textarea
            label={t('samples.notesLabel')}
            placeholder={t('samples.notesPlaceholder')}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.validation')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="hint" isStretched>
            <Textarea
              label={t('samples.notesLabel')}
              hint={t('samples.fieldHint')}
            />
          </Specimen>
          <Specimen label="error" isStretched>
            <Textarea
              label={t('samples.notesLabel')}
              error={t('samples.fieldError')}
            />
          </Specimen>
          <Specimen label="required" isStretched>
            <Textarea label={t('samples.notesLabel')} required />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="disabled" isStretched>
            <Textarea label={t('samples.notesLabel')} disabled />
          </Specimen>
          <Specimen label="rows={6}" isStretched>
            <Textarea label={t('samples.notesLabel')} rows={6} />
          </Specimen>
        </Stack>
      </ShowcaseSection>
    </>
  )
}
