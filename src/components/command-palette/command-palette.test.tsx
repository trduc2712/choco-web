import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { CommandPalette } from '@/components/command-palette/command-palette'
import type { CommandPaletteItem } from '@/components/command-palette/filter-commands'
import { filterCommands } from '@/components/command-palette/filter-commands'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const ITEMS: CommandPaletteItem[] = [
  { id: 'new-order', label: 'New order', icon: 'plus', group: 'Orders' },
  { id: 'refund', label: 'Refund order', group: 'Orders', keywords: ['money'] },
  { id: 'theme', label: 'Change theme', icon: 'palette', group: 'Settings' },
]

function renderPalette(onSelect = vi.fn(), onClose = vi.fn()) {
  render(
    <CommandPalette
      isOpen
      label="Commands"
      placeholder="Type a command"
      items={ITEMS}
      onSelect={onSelect}
      onClose={onClose}
    />,
  )

  return {
    onSelect,
    onClose,
    input: screen.getByRole('combobox', { name: 'Commands' }),
  }
}

test('ranks label prefixes first and matches keywords', () => {
  expect(filterCommands(ITEMS, 'order').map((item) => item.id)).toEqual([
    'new-order',
    'refund',
  ])
  expect(filterCommands(ITEMS, 'money').map((item) => item.id)).toEqual([
    'refund',
  ])
})

test('groups every command until a query is typed', async () => {
  renderPalette()
  const dialog = screen.getByRole('dialog', { name: 'Commands' })

  expect(
    within(dialog).getByRole('group', { name: 'Orders' }),
  ).toBeInTheDocument()
  expect(within(dialog).getAllByRole('option')).toHaveLength(3)
  await expectNoA11yViolations(document.body)
})

test('moves through results and runs the chosen command', async () => {
  const { input, onSelect, onClose } = renderPalette()

  await userEvent.type(input, 'order')
  const options = screen.getAllByRole('option')

  expect(options[0]).toHaveAttribute('aria-selected', 'true')

  await userEvent.keyboard('{ArrowDown}')

  expect(input).toHaveAttribute('aria-activedescendant', options[1].id)

  await userEvent.keyboard('{Enter}')

  expect(onClose).toHaveBeenCalled()
  expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
})

test('tells when nothing matches', async () => {
  const { input } = renderPalette()

  await userEvent.type(input, 'zzz')

  expect(
    screen.getByText(i18n.t('commandPalette.empty', { query: 'zzz' })),
  ).toHaveAttribute('role', 'status')
})
