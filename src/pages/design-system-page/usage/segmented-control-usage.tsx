import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SegmentedControl } from '@/components'

export function SegmentedControlUsage() {
  const { t } = useTranslation('designSystem')
  const [view, setView] = useState('list')

  return (
    <SegmentedControl
      label={t('samples.viewLabel')}
      value={view}
      onChange={setView}
      options={[
        { value: 'list', label: t('samples.viewList'), icon: 'layout-list' },
        { value: 'grid', label: t('samples.viewGrid'), icon: 'layout-grid' },
      ]}
    />
  )
}
