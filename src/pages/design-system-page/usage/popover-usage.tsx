import { useTranslation } from 'react-i18next'

import { Button, Popover, Text } from '@/components'

export function PopoverUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Popover
      title={t('samples.popoverTitle')}
      trigger={<Button variant="secondary">{t('samples.share')}</Button>}
    >
      <Text size="sm">{t('samples.popoverBody')}</Text>
    </Popover>
  )
}
