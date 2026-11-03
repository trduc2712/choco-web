import { useTranslation } from 'react-i18next'

import { Breadcrumb } from '@/components'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function BreadcrumbEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.default')}>
      <Specimen label="2 items">
        <Breadcrumb
          items={[
            { label: t('samples.home'), to: DESIGN_SYSTEM_PATH },
            { label: t('samples.currentPage') },
          ]}
        />
      </Specimen>
      <Specimen label="3 items">
        <Breadcrumb
          items={[
            { label: t('samples.home'), to: DESIGN_SYSTEM_PATH },
            { label: t('samples.library'), to: DESIGN_SYSTEM_PATH },
            { label: t('samples.currentPage') },
          ]}
        />
      </Specimen>
    </ShowcaseSection>
  )
}
