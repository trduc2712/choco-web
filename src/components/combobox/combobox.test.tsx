import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { ComboboxSize } from '@/components/combobox/combobox'
import type { ComboboxOption } from '@/components/combobox/combobox'
import { Combobox } from '@/components/combobox/combobox'
import styles from '@/components/combobox/combobox.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

const OPTIONS: ComboboxOption[] = [
  { value: 'avatar', label: 'Avatar' },
  { value: 'badge', label: 'Badge' },
  { value: 'button', label: 'Button' },
]

function renderCombobox() {
  const onSelect = vi.fn<(value: string) => void>()
  const view = render(
    <Combobox label="Search" options={OPTIONS} onSelect={onSelect} />,
  )

  return { ...view, onSelect, input: screen.getByRole('combobox') }
}

test('is closed until focused', async () => {
  const { input, container } = renderCombobox()

  expect(input).toHaveAccessibleName('Search')
  expect(input).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('lists every option when focused', async () => {
  const { input, container } = renderCombobox()

  await userEvent.click(input)

  expect(input).toHaveAttribute('aria-expanded', 'true')
  expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id)
  expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length)
  await expectNoA11yViolations(container)
})

test('filters options as the user types, ignoring case', async () => {
  const { input } = renderCombobox()

  await userEvent.type(input, 'BU')

  expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
    'Button',
  ])
})

test('selects the active option with the keyboard', async () => {
  const { input, onSelect } = renderCombobox()

  await userEvent.click(input)
  await userEvent.keyboard('{ArrowDown}')

  const active = screen.getByRole('option', { name: 'Badge' })
  expect(active).toHaveAttribute('aria-selected', 'true')
  expect(input).toHaveAttribute('aria-activedescendant', active.id)

  await userEvent.keyboard('{Enter}')

  expect(onSelect).toHaveBeenCalledWith('badge')
  expect(input).toHaveValue('')
  expect(input).toHaveFocus()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('wraps from the first option to the last', async () => {
  const { input } = renderCombobox()

  await userEvent.click(input)
  await userEvent.keyboard('{ArrowUp}')

  expect(screen.getByRole('option', { name: 'Button' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('selects an option when clicked', async () => {
  const { input, onSelect } = renderCombobox()

  await userEvent.click(input)
  await userEvent.click(screen.getByRole('option', { name: 'Avatar' }))

  expect(onSelect).toHaveBeenCalledWith('avatar')
})

test('closes on Escape without selecting', async () => {
  const { input, onSelect } = renderCombobox()

  await userEvent.click(input)
  await userEvent.keyboard('{Escape}')

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(onSelect).not.toHaveBeenCalled()
})

test('announces when nothing matches', async () => {
  const { input, onSelect } = renderCombobox()

  await userEvent.type(input, 'zzz{Enter}')

  expect(screen.getByRole('status')).toHaveTextContent(
    i18n.t('combobox.noResults'),
  )
  expect(input).toHaveAttribute('aria-expanded', 'false')
  expect(onSelect).not.toHaveBeenCalled()
})

const SIZES: ComboboxSize[] = ['sm', 'md', 'lg']

test.each(SIZES)('applies the %s size', (size) => {
  render(
    <Combobox
      label="Search"
      options={OPTIONS}
      size={size}
      onSelect={vi.fn()}
    />,
  )

  expectStyle(screen.getByRole('combobox'), styles, size)
})

test('cannot be used while disabled', async () => {
  render(
    <Combobox label="Search" options={OPTIONS} isDisabled onSelect={vi.fn()} />,
  )
  const input = screen.getByRole('combobox')

  await userEvent.click(input)

  expect(input).toBeDisabled()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('keeps its label for assistive technology when visually hidden', () => {
  render(
    <Combobox
      label="Search"
      options={OPTIONS}
      isLabelHidden
      onSelect={vi.fn()}
    />,
  )

  expect(screen.getByRole('combobox', { name: 'Search' })).toBeInTheDocument()
})
