import { useTranslation } from 'react-i18next'

import { Breadcrumb } from '@/components'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'

export function BreadcrumbUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Breadcrumb
      items={[
        { label: t('samples.home'), to: DESIGN_SYSTEM_PATH },
        { label: t('samples.library'), to: DESIGN_SYSTEM_PATH },
        { label: t('samples.currentPage') },
      ]}
    />
  )
}
