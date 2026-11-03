import { useTranslation } from 'react-i18next'

import { ScrollArea, Stack, Text } from '@/components'

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8]

export function ScrollAreaUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <ScrollArea label={t('samples.activity')} maxHeight="10rem">
      <Stack gap={2}>
        {NUMBERS.map((number) => (
          <Text key={number}>{t('samples.activityEntry', { number })}</Text>
        ))}
      </Stack>
    </ScrollArea>
  )
}
