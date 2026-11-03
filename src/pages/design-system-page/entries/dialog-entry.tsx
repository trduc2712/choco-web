import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { DialogSize } from '@/components'
import { Button, Dialog, Text } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const SIZES: DialogSize[] = ['sm', 'md', 'lg']

export function DialogEntry() {
  const { t } = useTranslation('designSystem')
  const [openSize, setOpenSize] = useState<DialogSize>()
  const [isMinimalOpen, setIsMinimalOpen] = useState(false)

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <Button variant="secondary" onClick={() => setOpenSize(size)}>
                {t('samples.openDialog')}
              </Button>
            </Specimen>
          ))}
        </SpecimenRow>
        <Dialog
          isOpen={openSize !== undefined}
          size={openSize}
          title={t('samples.dialogTitle')}
          description={t('samples.dialogDescription')}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setOpenSize(undefined)}
              >
                {t('samples.cancel')}
              </Button>
              <Button variant="danger" onClick={() => setOpenSize(undefined)}>
                {t('samples.delete')}
              </Button>
            </>
          }
          onClose={() => setOpenSize(undefined)}
        >
          <Text>{t('samples.dialogBody')}</Text>
        </Dialog>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.minimal')}>
        <Specimen label="title">
          <Button variant="secondary" onClick={() => setIsMinimalOpen(true)}>
            {t('samples.openDialog')}
          </Button>
        </Specimen>
        <Dialog
          isOpen={isMinimalOpen}
          size="sm"
          title={t('samples.alertTitle')}
          onClose={() => setIsMinimalOpen(false)}
        >
          <Text>{t('samples.alertBody')}</Text>
        </Dialog>
      </ShowcaseSection>
    </>
  )
}
