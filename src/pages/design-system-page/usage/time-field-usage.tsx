import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TimeField } from '@/components'

export function TimeFieldUsage() {
  const { t } = useTranslation('designSystem')
  const [time, setTime] = useState<string | null>('09:00')

  return (
    <TimeField
      label={t('samples.timeLabel')}
      name="time"
      value={time}
      onChange={setTime}
      step={30}
    />
  )
}
