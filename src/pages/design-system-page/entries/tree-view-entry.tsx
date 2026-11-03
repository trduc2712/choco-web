import { useTranslation } from 'react-i18next'

import type { TreeNode } from '@/components'
import { TreeView } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const NODES: TreeNode[] = [
  {
    id: 'folder-1',
    label: 'folder-1',
    icon: 'folder',
    children: [
      {
        id: 'folder-2',
        label: 'folder-2',
        icon: 'folder',
        children: [
          { id: 'file-1', label: 'file-1.txt', icon: 'file-text' },
          { id: 'file-2', label: 'file-2.txt', icon: 'file-text' },
        ],
      },
      { id: 'file-3', label: 'file-3.txt', icon: 'file-text' },
    ],
  },
  {
    id: 'folder-3',
    label: 'folder-3',
    icon: 'folder',
    children: [{ id: 'image-1', label: 'image-1.png', icon: 'file-image' }],
  },
  { id: 'file-4', label: 'file-4.txt', icon: 'file-text' },
  { id: 'file-5', label: 'file-5.txt', icon: 'file', isDisabled: true },
]

export function TreeViewEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.nested')}>
      <Specimen label="defaultExpandedIds" isStretched>
        <div className={styles.narrow}>
          <TreeView
            label={t('samples.filesLabel')}
            nodes={NODES}
            defaultExpandedIds={['folder-1', 'folder-2']}
            defaultSelectedId="file-2"
          />
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
