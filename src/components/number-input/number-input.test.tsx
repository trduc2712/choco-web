import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { NumberInput } from '@/components/number-input/number-input'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

function renderNumberInput(onChange = vi.fn()) {
  const view = render(
    <NumberInput
      label="Quantity"
      defaultValue={2}
      min={0}
      max={10}
      onChange={onChange}
    />,
  )

  return { ...view, onChange, input: screen.getByRole('spinbutton') }
}

test('is a spin button with its range', async () => {
  const { input, container } = renderNumberInput()

  expect(input).toHaveAccessibleName('Quantity')
  expect(input).toHaveValue('2')
  expect(input).toHaveAttribute('aria-valuemin', '0')
  expect(input).toHaveAttribute('aria-valuemax', '10')
  await expectNoA11yViolations(container)
})

test('steps with the buttons and arrow keys within the range', async () => {
  const { input, onChange } = renderNumberInput()

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('numberInput.increment') }),
  )

  expect(input).toHaveValue('3')

  await userEvent.click(input)
  await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')

  expect(input).toHaveValue('10')
  expect(
    screen.getByRole('button', { name: i18n.t('numberInput.increment') }),
  ).toBeDisabled()

  await userEvent.keyboard('{Home}')

  expect(onChange).toHaveBeenLastCalledWith(0)
})

test('parses typed values on blur and clamps them', async () => {
  const { input, onChange } = renderNumberInput()

  await userEvent.clear(input)
  await userEvent.type(input, '42')
  await userEvent.tab()

  expect(onChange).toHaveBeenLastCalledWith(10)
  expect(input).toHaveValue('10')

  await userEvent.clear(input)
  await userEvent.tab()

  expect(onChange).toHaveBeenLastCalledWith(null)
})
