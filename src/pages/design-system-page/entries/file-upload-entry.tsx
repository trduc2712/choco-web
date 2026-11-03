import { useTranslation } from 'react-i18next'

import { FileUpload, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function FileUploadEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.multiple')}>
        <Specimen label="isMultiple" isStretched>
          <div className={styles.narrow}>
            <FileUpload
              label={t('samples.attachmentsLabel')}
              accept="image/png,application/pdf"
              hint={t('samples.attachmentsHint')}
              isMultiple
            />
          </div>
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="error" isStretched>
            <FileUpload
              label={t('samples.avatarLabel')}
              accept="image/*"
              error={t('samples.fieldError')}
            />
          </Specimen>
          <Specimen label="isDisabled" isStretched>
            <FileUpload label={t('samples.avatarLabel')} isDisabled />
          </Specimen>
        </Stack>
      </ShowcaseSection>
    </>
  )
}
