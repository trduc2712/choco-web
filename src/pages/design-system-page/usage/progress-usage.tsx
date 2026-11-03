import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Progress, Stack } from '@/components'

const STEP = 20
const MAX = 100

export function ProgressUsage() {
  const { t } = useTranslation('designSystem')
  const [value, setValue] = useState(STEP)

  return (
    <Stack gap={3}>
      <Progress
        label={t('samples.progressLabel')}
        value={value}
        max={MAX}
        tone={value === MAX ? 'success' : 'primary'}
        isValueShown
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          setValue((current) => (current >= MAX ? 0 : current + STEP))
        }
      >
        {t('samples.add')}
      </Button>
    </Stack>
  )
}
