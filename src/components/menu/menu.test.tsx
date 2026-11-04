import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Menu } from '@/components/menu/menu'
import styles from '@/components/menu/menu.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectNoStyle, expectStyle } from '@/test/styles'

function renderMenu() {
  const onEdit = vi.fn()
  const onArchive = vi.fn()
  const onDelete = vi.fn()
  const view = render(
    <Menu
      label="Actions"
      items={[
        { id: 'edit', label: 'Edit', onSelect: onEdit },
        {
          id: 'archive',
          label: 'Archive',
          onSelect: onArchive,
          isDisabled: true,
        },
        { id: 'delete', label: 'Delete', onSelect: onDelete, tone: 'danger' },
      ]}
    />,
  )

  return {
    ...view,
    onEdit,
    onArchive,
    onDelete,
    trigger: screen.getByRole('button', { name: 'Actions' }),
  }
}

test('is closed until its trigger is used', async () => {
  const { trigger, container } = renderMenu()

  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('opens on click and focuses the first item', async () => {
  const { trigger, container } = renderMenu()

  await userEvent.click(trigger)

  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus()
  await expectNoA11yViolations(container)
})

test('moves with the arrow keys, skipping disabled items', async () => {
  const { trigger } = renderMenu()

  await userEvent.click(trigger)
  await userEvent.keyboard('{ArrowDown}')

  expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()

  await userEvent.keyboard('{ArrowDown}')

  expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus()
})

test('selects an item, closes and returns focus to the trigger', async () => {
  const { trigger, onDelete } = renderMenu()

  await userEvent.click(trigger)
  await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))

  expect(onDelete).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

test('ignores disabled items', async () => {
  const { trigger, onArchive } = renderMenu()

  await userEvent.click(trigger)
  await userEvent.click(screen.getByRole('menuitem', { name: 'Archive' }))

  expect(onArchive).not.toHaveBeenCalled()
  expect(screen.getByRole('menu')).toBeInTheDocument()
})

test('closes on Escape and returns focus to the trigger', async () => {
  const { trigger } = renderMenu()

  await userEvent.click(trigger)
  await userEvent.keyboard('{Escape}')

  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

test('closes when clicking outside', async () => {
  const { trigger } = renderMenu()

  await userEvent.click(trigger)
  await userEvent.click(document.body)

  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('can show only an icon while keeping its name', () => {
  render(<Menu label="More" icon="more-horizontal" isLabelHidden items={[]} />)

  expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
})

test('renders custom trigger content inside a button named by the label', async () => {
  const onSignOut = vi.fn()
  const { container } = render(
    <Menu
      label="Account"
      trigger={<span data-testid="avatar">AL</span>}
      items={[{ id: 'sign-out', label: 'Sign out', onSelect: onSignOut }]}
    />,
  )
  const trigger = screen.getByRole('button', { name: 'Account' })

  expect(trigger).toContainElement(screen.getByTestId('avatar'))
  expect(trigger).toHaveAttribute('aria-haspopup', 'menu')

  await userEvent.click(trigger)

  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expectNoA11yViolations(container)

  await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))

  expect(onSignOut).toHaveBeenCalledOnce()
  expect(trigger).toHaveFocus()
})

test('opens below its trigger by default and accepts a placement', async () => {
  const { rerender } = render(
    <Menu
      label="Actions"
      items={[{ id: 'edit', label: 'Edit', onSelect: vi.fn() }]}
    />,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Actions' }))

  expect(screen.getByRole('menu')).toHaveAttribute('data-side', 'bottom')

  await userEvent.keyboard('{Escape}')
  rerender(
    <Menu
      label="Actions"
      placement="right-start"
      items={[{ id: 'edit', label: 'Edit', onSelect: vi.fn() }]}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Actions' }))

  expect(screen.getByRole('menu')).toHaveAttribute('data-side', 'right')
})

test('groups items into labelled sections with separators', async () => {
  const { container } = render(
    <Menu
      label="File"
      items={[
        {
          id: 'edit',
          label: 'Edit',
          items: [
            {
              id: 'copy',
              label: 'Copy',
              shortcut: 'Ctrl+C',
              onSelect: vi.fn(),
            },
            { id: 'paste', label: 'Paste', onSelect: vi.fn() },
          ],
        },
        { id: 'delete', label: 'Delete', onSelect: vi.fn(), tone: 'danger' },
      ]}
    />,
  )

  await userEvent.click(screen.getByRole('button', { name: 'File' }))

  expect(screen.getByRole('group', { name: 'Edit' })).toContainElement(
    screen.getByRole('menuitem', { name: 'Copy' }),
  )
  expect(screen.getByRole('separator')).toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveAttribute(
    'aria-keyshortcuts',
    'Ctrl+C',
  )

  await userEvent.keyboard('{ArrowUp}')

  expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
  await expectNoA11yViolations(container)
})

test('jumps to an item by typing its first letters', async () => {
  const { trigger } = renderMenu()

  await userEvent.click(trigger)
  await userEvent.keyboard('d')

  expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
})

test('marks danger items', async () => {
  const { trigger } = renderMenu()

  await userEvent.click(trigger)

  expectStyle(
    screen.getByRole('menuitem', { name: 'Delete' }),
    styles,
    'danger',
  )
  expectNoStyle(
    screen.getByRole('menuitem', { name: 'Edit' }),
    styles,
    'danger',
  )
})

test('opens on the last item with the up arrow', async () => {
  renderMenu()

  await userEvent.tab()
  await userEvent.keyboard('{ArrowUp}')

  expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
})

test('jumps to the first and last items with Home and End', async () => {
  const { trigger } = renderMenu()

  await userEvent.click(trigger)
  await userEvent.keyboard('{End}')

  expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()

  await userEvent.keyboard('{Home}')

  expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus()
})

test('checks one item and opens on it', async () => {
  const onSelect = vi.fn()
  const { container } = render(
    <Menu
      label="Sort"
      items={[
        { id: 'new', label: 'Newest', onSelect, isChecked: false },
        { id: 'old', label: 'Oldest', onSelect, isChecked: true },
      ]}
    />,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Sort' }))

  const oldest = screen.getByRole('menuitemradio', { name: 'Oldest' })

  expect(oldest).toHaveAttribute('aria-checked', 'true')
  expect(oldest).toHaveFocus()
  expect(screen.getByRole('menuitemradio', { name: 'Newest' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
  await expectNoA11yViolations(container)
})

function renderSubmenu() {
  const onDark = vi.fn()
  const onSignOut = vi.fn()
  const view = render(
    <Menu
      label="Account"
      items={[
        {
          id: 'theme',
          label: 'Theme',
          value: 'Light',
          submenu: [
            { id: 'light', label: 'Light', isChecked: true, onSelect: vi.fn() },
            { id: 'dark', label: 'Dark', isChecked: false, onSelect: onDark },
          ],
        },
        { id: 'sign-out', label: 'Sign out', onSelect: onSignOut },
      ]}
    />,
  )

  return {
    ...view,
    onDark,
    onSignOut,
    trigger: screen.getByRole('button', { name: 'Account' }),
  }
}

test('opens a submenu on click and focuses its checked item', async () => {
  const { trigger, container } = renderSubmenu()

  await userEvent.click(trigger)
  const theme = screen.getByRole('menuitem', { name: /Theme/ })

  expect(theme).toHaveAttribute('aria-haspopup', 'menu')
  expect(theme).toHaveAttribute('aria-expanded', 'false')
  expect(theme).toHaveTextContent('Light')

  await userEvent.click(theme)

  const submenu = screen.getByRole('menu', { name: 'Theme' })

  expect(theme).toHaveAttribute('aria-expanded', 'true')
  expect(theme).toHaveAttribute('aria-controls', submenu.id)
  expect(screen.getByRole('menuitemradio', { name: 'Light' })).toHaveFocus()
  await expectNoA11yViolations(container)
  await expectNoA11yViolations(submenu)
})

test('runs a submenu item and closes every menu', async () => {
  const { trigger, onDark } = renderSubmenu()

  await userEvent.click(trigger)
  await userEvent.click(screen.getByRole('menuitem', { name: /Theme/ }))
  await userEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }))

  expect(onDark).toHaveBeenCalledOnce()
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

test('moves in and out of a submenu with the arrow keys', async () => {
  const { trigger } = renderSubmenu()

  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  const theme = screen.getByRole('menuitem', { name: /Theme/ })

  expect(theme).toHaveFocus()

  await userEvent.keyboard('{ArrowRight}')

  expect(screen.getByRole('menuitemradio', { name: 'Light' })).toHaveFocus()

  await userEvent.keyboard('{ArrowDown}')

  expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toHaveFocus()

  await userEvent.keyboard('{ArrowLeft}')

  expect(screen.queryByRole('menu', { name: 'Theme' })).not.toBeInTheDocument()
  expect(screen.getByRole('menu', { name: 'Account' })).toBeInTheDocument()
  expect(theme).toHaveFocus()
})

test('closes only the submenu on Escape', async () => {
  const { trigger } = renderSubmenu()

  await userEvent.click(trigger)
  await userEvent.click(screen.getByRole('menuitem', { name: /Theme/ }))
  await userEvent.keyboard('{Escape}')

  expect(screen.queryByRole('menu', { name: 'Theme' })).not.toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: /Theme/ })).toHaveFocus()

  await userEvent.keyboard('{Escape}')

  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

test('opens a submenu on hover without moving focus into it', async () => {
  const { trigger } = renderSubmenu()

  await userEvent.click(trigger)
  await userEvent.hover(screen.getByRole('menuitem', { name: /Theme/ }))

  expect(screen.getByRole('menu', { name: 'Theme' })).toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: /Theme/ })).toHaveFocus()

  await userEvent.hover(screen.getByRole('menuitem', { name: 'Sign out' }))

  expect(screen.queryByRole('menu', { name: 'Theme' })).not.toBeInTheDocument()
})

test('keeps the menu open when clicking inside a submenu', async () => {
  const { trigger } = renderSubmenu()

  await userEvent.click(trigger)
  await userEvent.click(screen.getByRole('menuitem', { name: /Theme/ }))
  await userEvent.pointer({
    keys: '[MouseLeft>]',
    target: screen.getByRole('menu', { name: 'Theme' }),
  })

  expect(screen.getByRole('menu', { name: 'Account' })).toBeInTheDocument()
  expect(screen.getByRole('menu', { name: 'Theme' })).toBeInTheDocument()
})
