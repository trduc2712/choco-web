import { useTranslation } from 'react-i18next'

import { Textarea } from '@/components'

export function TextareaUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Textarea
      label={t('samples.notesLabel')}
      placeholder={t('samples.notesPlaceholder')}
      hint={t('samples.fieldHint')}
      rows={4}
    />
  )
}
