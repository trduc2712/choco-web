import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { AlertDialogTone } from '@/components'
import { AlertDialog, Button } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

export function AlertDialogEntry() {
  const { t } = useTranslation('designSystem')
  const [openTone, setOpenTone] = useState<AlertDialogTone>()
  const [isConfirming, setIsConfirming] = useState(false)
  const isDanger = openTone === 'danger'

  function close() {
    setOpenTone(undefined)
    setIsConfirming(false)
  }

  function confirm() {
    setIsConfirming(true)
    setTimeout(close, 1200)
  }

  return (
    <ShowcaseSection title={t('sections.tones')}>
      <SpecimenRow>
        <Specimen label="danger">
          <Button variant="danger" onClick={() => setOpenTone('danger')}>
            {t('samples.deleteProject')}
          </Button>
        </Specimen>
        <Specimen label="primary">
          <Button variant="secondary" onClick={() => setOpenTone('primary')}>
            {t('samples.publish')}
          </Button>
        </Specimen>
      </SpecimenRow>
      <AlertDialog
        isOpen={openTone !== undefined}
        tone={openTone}
        title={
          isDanger ? t('samples.alertDialogTitle') : t('samples.publishTitle')
        }
        description={
          isDanger
            ? t('samples.alertDialogDescription')
            : t('samples.publishDescription')
        }
        confirmLabel={isDanger ? t('samples.delete') : t('samples.publish')}
        isConfirming={isConfirming}
        onConfirm={confirm}
        onCancel={close}
      />
    </ShowcaseSection>
  )
}
