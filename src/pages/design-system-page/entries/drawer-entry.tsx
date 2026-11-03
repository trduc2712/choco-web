import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { DrawerSide } from '@/components'
import { Button, CheckboxGroup, Drawer } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const SIDES: DrawerSide[] = ['start', 'end', 'bottom']

export function DrawerEntry() {
  const { t } = useTranslation('designSystem')
  const [openSide, setOpenSide] = useState<DrawerSide>()

  function close() {
    setOpenSide(undefined)
  }

  return (
    <ShowcaseSection title={t('sections.sides')}>
      <SpecimenRow>
        {SIDES.map((side) => (
          <Specimen key={side} label={side}>
            <Button variant="secondary" onClick={() => setOpenSide(side)}>
              {t('samples.openDrawer')}
            </Button>
          </Specimen>
        ))}
      </SpecimenRow>
      <Drawer
        isOpen={openSide !== undefined}
        side={openSide}
        title={t('samples.drawerTitle')}
        description={t('samples.drawerDescription')}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('samples.cancel')}
            </Button>
            <Button onClick={close}>{t('samples.apply')}</Button>
          </>
        }
      >
        <CheckboxGroup
          label={t('samples.colStatus')}
          name="drawer-status"
          options={[
            { value: 'paid', label: t('samples.statusPaid') },
            { value: 'pending', label: t('samples.statusPending') },
            { value: 'refunded', label: t('samples.statusRefunded') },
          ]}
        />
      </Drawer>
    </ShowcaseSection>
  )
}
