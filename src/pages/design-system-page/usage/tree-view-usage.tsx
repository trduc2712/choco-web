import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TreeView } from '@/components'

export function TreeViewUsage() {
  const { t } = useTranslation('designSystem')
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <TreeView
      label={t('samples.filesLabel')}
      selectedId={selected}
      onSelect={setSelected}
      nodes={[
        {
          id: 'folder-1',
          label: 'folder-1',
          icon: 'folder',
          children: [{ id: 'file-1', label: 'file-1.txt', icon: 'file-text' }],
        },
        { id: 'file-2', label: 'file-2.txt', icon: 'file-text' },
      ]}
    />
  )
}
