import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { TreeNode } from '@/components/tree-view/tree-view'
import { TreeView } from '@/components/tree-view/tree-view'
import { expectNoA11yViolations } from '@/test/a11y'

const NODES: TreeNode[] = [
  {
    id: 'folder',
    label: 'folder',
    icon: 'folder',
    children: [
      { id: 'file-1', label: 'file-1.txt', icon: 'file-text' },
      { id: 'file-2', label: 'file-2.txt', icon: 'file-text' },
    ],
  },
  { id: 'other', label: 'other.txt', icon: 'file-text' },
]

function item(name: string | RegExp) {
  return screen.getByRole('treeitem', { name })
}

test('is a tree with levels, positions and one tab stop', async () => {
  const { container } = render(
    <TreeView label="Files" nodes={NODES} defaultExpandedIds={['folder']} />,
  )

  expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument()
  expect(item('file-1.txt')).toHaveAttribute('aria-level', '2')
  expect(item('file-2.txt')).toHaveAttribute('aria-posinset', '2')
  expect(item(/^folder/)).toHaveAttribute('aria-expanded', 'true')
  expect(item(/^folder/)).toHaveAttribute('tabindex', '0')
  expect(item('other.txt')).toHaveAttribute('tabindex', '-1')
  await expectNoA11yViolations(container)
})

test('expands, collapses and moves with the arrow keys', async () => {
  render(<TreeView label="Files" nodes={NODES} />)

  await userEvent.tab()
  await userEvent.keyboard('{ArrowRight}')

  expect(item(/^folder/)).toHaveAttribute('aria-expanded', 'true')

  await userEvent.keyboard('{ArrowRight}')

  expect(item('file-1.txt')).toHaveFocus()

  await userEvent.keyboard('{End}')

  expect(item('other.txt')).toHaveFocus()

  await userEvent.keyboard('{ArrowUp}{ArrowLeft}')

  expect(item(/^folder/)).toHaveFocus()

  await userEvent.keyboard('{ArrowLeft}')

  expect(item(/^folder/)).toHaveAttribute('aria-expanded', 'false')
  expect(
    screen.queryByRole('treeitem', { name: 'file-1.txt' }),
  ).not.toBeInTheDocument()
})

test('selects with Enter or a click and jumps by first letter', async () => {
  const onSelect = vi.fn()
  render(<TreeView label="Files" nodes={NODES} onSelect={onSelect} />)

  await userEvent.tab()
  await userEvent.keyboard('o')

  expect(item('other.txt')).toHaveFocus()

  await userEvent.keyboard('{Enter}')

  expect(onSelect).toHaveBeenLastCalledWith('other')
  expect(item('other.txt')).toHaveAttribute('aria-selected', 'true')

  await userEvent.click(screen.getByText('folder'))

  expect(onSelect).toHaveBeenLastCalledWith('folder')
  expect(item(/^folder/)).toHaveAttribute('aria-expanded', 'true')
})
