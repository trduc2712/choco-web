import { useTranslation } from 'react-i18next'

import { Button, Tooltip } from '@/components'

export function TooltipUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Tooltip content={t('samples.tooltip')}>
      <Button
        icon="link"
        variant="secondary"
        aria-label={t('samples.copyLink')}
      />
    </Tooltip>
  )
}
