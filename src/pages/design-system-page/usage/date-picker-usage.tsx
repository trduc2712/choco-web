import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DatePicker } from '@/components'

export function DatePickerUsage() {
  const { t } = useTranslation('designSystem')
  const [dueDate, setDueDate] = useState<Date | null>(null)

  return (
    <form>
      <DatePicker
        label={t('samples.dueDateLabel')}
        name="due-date"
        value={dueDate}
        onChange={setDueDate}
        min={new Date()}
      />
    </form>
  )
}
