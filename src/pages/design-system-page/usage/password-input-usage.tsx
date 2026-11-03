import { useTranslation } from 'react-i18next'

import { PasswordInput } from '@/components'

export function PasswordInputUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <PasswordInput
      label={t('samples.passwordLabel')}
      autoComplete="new-password"
      hint={t('samples.newPasswordHint')}
    />
  )
}
