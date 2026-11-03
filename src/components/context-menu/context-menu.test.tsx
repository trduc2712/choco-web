import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { ContextMenu } from '@/components/context-menu/context-menu'
import { expectNoA11yViolations } from '@/test/a11y'

function renderContextMenu() {
  const onRename = vi.fn()
  const view = render(
    <ContextMenu
      label="File actions"
      items={[
        { id: 'rename', label: 'Rename', onSelect: onRename },
        { id: 'delete', label: 'Delete', onSelect: vi.fn(), tone: 'danger' },
      ]}
    >
      <button type="button">file.pdf</button>
    </ContextMenu>,
  )

  return { ...view, onRename, target: screen.getByRole('button') }
}

test('opens at the pointer on right click', async () => {
  const { target } = renderContextMenu()

  fireEvent.contextMenu(target, { clientX: 40, clientY: 60 })

  expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus()
  await expectNoA11yViolations(document.body)
})

test('opens from the keyboard and returns focus on Escape', async () => {
  const { target } = renderContextMenu()

  target.focus()
  await userEvent.keyboard('{Shift>}{F10}{/Shift}')

  expect(screen.getByRole('menu')).toBeInTheDocument()

  await userEvent.keyboard('{Escape}')

  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(target).toHaveFocus()
})

test('selects an item and closes', async () => {
  const { target, onRename } = renderContextMenu()

  fireEvent.contextMenu(target)
  await userEvent.click(screen.getByRole('menuitem', { name: 'Rename' }))

  expect(onRename).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('keeps the native menu when disabled', () => {
  render(
    <ContextMenu label="Actions" items={[]} isDisabled>
      <p>Area</p>
    </ContextMenu>,
  )

  fireEvent.contextMenu(screen.getByText('Area'))

  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})
