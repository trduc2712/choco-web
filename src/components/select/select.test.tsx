import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { SelectSize } from '@/components/select/select'
import type { SelectProps } from '@/components/select/select'
import { Select } from '@/components/select/select'
import styles from '@/components/select/select.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

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

test('shows the placeholder when no value is selected', async () => {
  const { trigger, container } = renderSelect()

  expect(trigger).toHaveValue('')
  expect(trigger).toHaveDisplayValue('Choose')
  await expectNoA11yViolations(container)
})

test('changes the selected value through the native control', async () => {
  const { trigger, onChange } = renderSelect()

  await userEvent.selectOptions(trigger, 'c')

  expect(onChange).toHaveBeenCalledWith('c')
  expect(trigger).toHaveDisplayValue('Gamma')
})

test('exposes disabled options and prevents selecting them', async () => {
  const { trigger, onChange } = renderSelect({ defaultValue: 'a' })

  expect(screen.getByRole('option', { name: 'Beta' })).toBeDisabled()
  await userEvent.selectOptions(trigger, 'b')

  expect(trigger).toHaveValue('a')
  expect(onChange).not.toHaveBeenCalled()
})

test('shows the placeholder for a missing controlled value', () => {
  const { trigger } = renderSelect({ value: 'missing' })

  expect(trigger).toHaveDisplayValue('Choose')
})

test('supports a selectable empty value for filters', async () => {
  const { trigger, onChange } = renderSelect({
    options: [{ value: '', label: 'All' }, ...OPTIONS],
    defaultValue: 'a',
  })

  await userEvent.selectOptions(trigger, '')

  expect(onChange).toHaveBeenCalledWith('')
  expect(trigger).toHaveDisplayValue('All')
})

test('requires a choice when the placeholder is shown', async () => {
  const { trigger } = renderSelect({ isRequired: true })

  expect(trigger).toBeInvalid()
  await userEvent.selectOptions(trigger, 'a')
  expect(trigger).toBeValid()
})

test('follows a controlled value', () => {
  const { trigger, rerender } = renderSelect({ value: 'a' })

  expect(trigger).toHaveDisplayValue('Alpha')

  rerender(<Select label="Group" options={OPTIONS} value="d" />)

  expect(trigger).toHaveDisplayValue('Delta')
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

test('keeps its label for assistive technology when visually hidden', () => {
  const { trigger } = renderSelect({ isLabelHidden: true })

  expect(trigger).toHaveAccessibleName('Group')
})
