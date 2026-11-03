import { useTranslation } from 'react-i18next'

import { PinInput } from '@/components'

export function PinInputUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <PinInput
      label={t('samples.codeLabel')}
      hint={t('samples.codeHint')}
      onComplete={(code) => console.warn(code)}
    />
  )
}
