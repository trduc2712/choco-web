import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertDialog, Button } from '@/components'

export function AlertDialogUsage() {
  const { t } = useTranslation('designSystem')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        {t('samples.deleteProject')}
      </Button>
      <AlertDialog
        isOpen={isOpen}
        title={t('samples.alertDialogTitle')}
        description={t('samples.alertDialogDescription')}
        confirmLabel={t('samples.delete')}
        onConfirm={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
      />
    </>
  )
}
