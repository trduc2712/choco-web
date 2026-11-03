import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Drawer, Text } from '@/components'

export function DrawerUsage() {
  const { t } = useTranslation('designSystem')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="secondary"
        iconStart="filter"
        onClick={() => setIsOpen(true)}
      >
        {t('samples.drawerTitle')}
      </Button>
      <Drawer
        isOpen={isOpen}
        title={t('samples.drawerTitle')}
        footer={
          <Button onClick={() => setIsOpen(false)}>{t('samples.apply')}</Button>
        }
        onClose={() => setIsOpen(false)}
      >
        <Text>{t('samples.drawerDescription')}</Text>
      </Drawer>
    </>
  )
}
