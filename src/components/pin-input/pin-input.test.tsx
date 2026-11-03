import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { PinInput } from '@/components/pin-input/pin-input'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

function cell(index: number) {
  return screen.getByRole('textbox', {
    name: i18n.t('pinInput.digit', { index, count: 4 }),
  })
}

test('labels each cell and moves forward as digits are typed', async () => {
  const onComplete = vi.fn()
  const { container } = render(
    <PinInput label="Verification code" length={4} onComplete={onComplete} />,
  )

  expect(
    screen.getByRole('group', { name: 'Verification code' }),
  ).toBeInTheDocument()
  expect(cell(1)).toHaveAttribute('autocomplete', 'one-time-code')

  await userEvent.click(cell(1))
  await userEvent.keyboard('12a34')

  expect(cell(4)).toHaveValue('4')
  expect(onComplete).toHaveBeenCalledWith('1234')
  await expectNoA11yViolations(container)
})

test('fills every cell from a paste', async () => {
  const onChange = vi.fn()
  render(<PinInput label="Code" length={4} onChange={onChange} />)

  await userEvent.click(cell(1))
  await userEvent.paste('9876')

  expect(onChange).toHaveBeenLastCalledWith('9876')
  expect(cell(4)).toHaveFocus()
})

test('erases backwards with Backspace', async () => {
  const onChange = vi.fn()
  render(
    <PinInput label="Code" length={4} defaultValue="12" onChange={onChange} />,
  )

  await userEvent.click(cell(3))
  await userEvent.keyboard('{Backspace}')

  expect(onChange).toHaveBeenLastCalledWith('1')
  expect(cell(2)).toHaveFocus()
})
