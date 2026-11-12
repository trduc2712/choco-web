import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PageSizeSelect } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function PageSizeSelectEntry() {
  const { t } = useTranslation('designSystem')
  const [size, setSize] = useState(20)
  const [custom, setCustom] = useState(5)

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Specimen label="value={20}">
          <PageSizeSelect value={size} onChange={setSize} />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.sizes')}>
        <Specimen label="options={[5, 15, 25]}">
          <PageSizeSelect
            value={custom}
            options={[5, 15, 25]}
            onChange={setCustom}
          />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
