import { useTranslation } from 'react-i18next'

import { Button, ContextMenu } from '@/components'

export function ContextMenuUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <ContextMenu
      label={t('samples.options')}
      items={[
        {
          id: 'rename',
          label: t('samples.rename'),
          icon: 'pencil',
          onSelect: () => {},
        },
        {
          id: 'delete',
          label: t('samples.delete'),
          icon: 'trash',
          tone: 'danger',
          onSelect: () => {},
        },
      ]}
    >
      <Button variant="secondary">{t('samples.contextMenuArea')}</Button>
    </ContextMenu>
  )
}
