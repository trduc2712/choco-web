import { useTranslation } from 'react-i18next'

import { PasswordInput, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function PasswordInputEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.states')}>
      <Stack gap={5} className={styles.narrow}>
        <Specimen label="current-password" isStretched>
          <PasswordInput label={t('samples.passwordLabel')} />
        </Specimen>
        <Specimen label="new-password" isStretched>
          <PasswordInput
            label={t('samples.passwordLabel')}
            autoComplete="new-password"
            hint={t('samples.newPasswordHint')}
          />
        </Specimen>
        <Specimen label="error" isStretched>
          <PasswordInput
            label={t('samples.passwordLabel')}
            error={t('samples.fieldError')}
          />
        </Specimen>
      </Stack>
    </ShowcaseSection>
  )
}
