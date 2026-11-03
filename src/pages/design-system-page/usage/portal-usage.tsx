import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Portal, Text } from '@/components'

export function PortalUsage() {
  const { t } = useTranslation('designSystem')
  const anchorRef = useRef<HTMLSpanElement>(null)

  return (
    <span ref={anchorRef}>
      <Portal anchorRef={anchorRef}>
        <Text size="sm">{t('samples.portalNote')}</Text>
      </Portal>
    </span>
  )
}
