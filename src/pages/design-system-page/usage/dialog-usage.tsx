import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Dialog, Text } from '@/components'

export function DialogUsage() {
  const { t } = useTranslation('designSystem')
  const [isOpen, setIsOpen] = useState(false)

  function close() {
    setIsOpen(false)
  }

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        {t('samples.delete')}
      </Button>
      <Dialog
        isOpen={isOpen}
        title={t('samples.dialogTitle')}
        description={t('samples.dialogDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('samples.cancel')}
            </Button>
            <Button variant="danger" onClick={close}>
              {t('samples.delete')}
            </Button>
          </>
        }
        onClose={close}
      >
        <Text>{t('samples.dialogBody')}</Text>
      </Dialog>
    </>
  )
}
