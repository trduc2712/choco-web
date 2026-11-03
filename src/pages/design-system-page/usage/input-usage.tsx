import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components'

export function InputUsage() {
  const { t } = useTranslation('designSystem')
  const [name, setName] = useState('')
  const [isTouched, setIsTouched] = useState(false)
  const error =
    isTouched && name.trim() === '' ? t('samples.fieldError') : undefined

  return (
    <Input
      label={t('samples.fieldLabel')}
      placeholder={t('samples.fieldPlaceholder')}
      hint={t('samples.fieldHint')}
      error={error}
      value={name}
      required
      onChange={(event) => setName(event.target.value)}
      onBlur={() => setIsTouched(true)}
    />
  )
}
