import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { SelectSize } from '@/components/select/select'
import type { SelectProps } from '@/components/select/select'
import { Select } from '@/components/select/select'
import styles from '@/components/select/select.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectNoStyle, expectStyle } from '@/test/styles'

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', isDisabled: true },
  { value: 'c', label: 'Gamma' },
  { value: 'd', label: 'Delta' },
]

function renderSelect(props: Partial<SelectProps> = {}) {
  const onChange = vi.fn<(value: string) => void>()
  const view = render(
    <Select
      label="Group"
      placeholder="Choose"
      options={OPTIONS}
      onChange={onChange}
      {...props}
    />,
  )

  return {
    ...view,
    onChange,
    trigger: screen.getByRole('combobox', { name: /^Group/ }),
  }
}

test('shows the placeholder and is closed by default', async () => {
  const { trigger, container } = renderSelect()

  expect(trigger).toHaveTextContent('Choose')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('opens on click and selects the clicked option', async () => {
  const { trigger, onChange, container } = renderSelect()

  await userEvent.click(trigger)

  expect(screen.getByRole('listbox', { name: 'Group' })).toBeInTheDocument()
  await expectNoA11yViolations(container)

  await userEvent.click(screen.getByRole('option', { name: 'Gamma' }))

  expect(onChange).toHaveBeenCalledWith('c')
  expect(trigger).toHaveTextContent('Gamma')
  expect(trigger).toHaveFocus()
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('marks the current value as selected when reopened', async () => {
  const { trigger } = renderSelect({ defaultValue: 'c' })

  await userEvent.click(trigger)

  const selected = screen.getByRole('option', { name: 'Gamma' })
  expect(selected).toHaveAttribute('aria-selected', 'true')
  expect(trigger).toHaveAttribute('aria-activedescendant', selected.id)
})

test('is operable with the keyboard and skips disabled options', async () => {
  const { trigger, onChange } = renderSelect()

  await userEvent.tab()
  await userEvent.keyboard('{ArrowDown}')

  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'Alpha' }).id,
  )

  await userEvent.keyboard('{ArrowDown}')

  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'Gamma' }).id,
  )

  await userEvent.keyboard('{Enter}')

  expect(onChange).toHaveBeenCalledWith('c')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

test('does not select a disabled option', async () => {
  const { trigger, onChange } = renderSelect()

  await userEvent.click(trigger)
  await userEvent.click(screen.getByRole('option', { name: 'Beta' }))

  expect(onChange).not.toHaveBeenCalled()
  expect(screen.getByRole('listbox')).toBeInTheDocument()
})

test('jumps to an option by typing', async () => {
  const { trigger } = renderSelect()

  await userEvent.tab()
  await userEvent.keyboard('de')

  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'Delta' }).id,
  )
})

test('closes on Escape without changing the value', async () => {
  const { trigger, onChange } = renderSelect({ defaultValue: 'a' })

  await userEvent.click(trigger)
  await userEvent.keyboard('{ArrowDown}{Escape}')

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  expect(onChange).not.toHaveBeenCalled()
  expect(trigger).toHaveTextContent('Alpha')
})

test('follows a controlled value', () => {
  const { trigger, rerender } = renderSelect({ value: 'a' })

  expect(trigger).toHaveTextContent('Alpha')

  rerender(<Select label="Group" options={OPTIONS} value="d" />)

  expect(trigger).toHaveTextContent('Delta')
})

test('submits its value with a form', async () => {
  const { container } = render(
    <form>
      <Select label="Group" name="group" options={OPTIONS} defaultValue="c" />
    </form>,
  )
  const form = container.querySelector('form')

  expect(form && new FormData(form).get('group')).toBe('c')
})

test('exposes its error, required and disabled states', async () => {
  const { trigger, container } = renderSelect({
    error: 'Choose a group',
    isRequired: true,
    isDisabled: true,
  })

  expect(trigger).toBeDisabled()
  expect(trigger).toBeInvalid()
  expect(trigger).toBeRequired()
  expect(trigger).toHaveAccessibleDescription('Choose a group')
  await expectNoA11yViolations(container)
})

const SIZES: SelectSize[] = ['sm', 'md', 'lg']

test.each(SIZES)('applies the %s size', (size) => {
  const { trigger } = renderSelect({ size })

  expectStyle(trigger, styles, size)
})

test('highlights the active option and checks the selected one', async () => {
  const { trigger } = renderSelect({ defaultValue: 'a' })

  await userEvent.click(trigger)
  await userEvent.keyboard('{ArrowDown}')

  const selected = screen.getByRole('option', { name: 'Alpha' })
  const active = screen.getByRole('option', { name: 'Gamma' })

  expectStyle(active, styles, 'active')
  expectNoStyle(selected, styles, 'active')
  expect(selected.querySelector('svg')).toBeInTheDocument()
  expect(active.querySelector('svg')).not.toBeInTheDocument()
})

test('keeps its label for assistive technology when visually hidden', () => {
  const { trigger } = renderSelect({ isLabelHidden: true })

  expect(trigger).toHaveAccessibleName('Group')
})
