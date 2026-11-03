import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Stack, Tag } from '@/components'

const INITIAL_NUMBERS = [1, 2, 3]

export function TagUsage() {
  const { t } = useTranslation('designSystem')
  const [numbers, setNumbers] = useState(INITIAL_NUMBERS)

  return (
    <Stack direction="row" gap={2} isWrapping>
      {numbers.map((number) => (
        <Tag
          key={number}
          label={t('samples.item', { number })}
          onRemove={() =>
            setNumbers((current) => current.filter((value) => value !== number))
          }
        />
      ))}
    </Stack>
  )
}
