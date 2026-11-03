import { useState } from 'react'

import { Calendar } from '@/components'

export function CalendarUsage() {
  const [date, setDate] = useState<Date | null>(null)

  return <Calendar value={date} min={new Date()} onChange={setDate} />
}
