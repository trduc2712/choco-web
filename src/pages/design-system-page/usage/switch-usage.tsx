import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Switch } from '@/components'

export function SwitchUsage() {
  const { t } = useTranslation('designSystem')
  const [isEnabled, setIsEnabled] = useState(false)

  return (
    <Switch
      label={t('samples.switchLabel')}
      checked={isEnabled}
      onChange={(event) => setIsEnabled(event.target.checked)}
    />
  )
}
