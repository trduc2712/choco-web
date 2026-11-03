import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components'

export function CheckboxUsage() {
  const { t } = useTranslation('designSystem')
  const [isChecked, setIsChecked] = useState(false)

  return (
    <Checkbox
      label={t('samples.checkboxLabel')}
      hint={t('samples.checkboxHint')}
      checked={isChecked}
      onChange={(event) => setIsChecked(event.target.checked)}
    />
  )
}
