import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { CheckboxGroup } from '@/components/checkbox-group/checkbox-group'
import { Fieldset } from '@/components/fieldset/fieldset'
import { expectNoA11yViolations } from '@/test/a11y'

const OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push', isDisabled: true },
]

test('a fieldset groups controls under a legend with hint and error', async () => {
  const { container } = render(
    <Fieldset legend="Address" hint="Where we ship" error="Required" isRequired>
      <input aria-label="Street" />
    </Fieldset>,
  )
  const group = screen.getByRole('group', { name: /^Address/ })

  expect(group).toHaveAccessibleDescription('Where we ship Required')
  expect(group).toHaveAttribute('aria-invalid', 'true')
  await expectNoA11yViolations(container)
})

test('a disabled fieldset disables its controls', () => {
  render(
    <Fieldset legend="Address" isDisabled>
      <input aria-label="Street" />
    </Fieldset>,
  )

  expect(screen.getByRole('textbox', { name: 'Street' })).toBeDisabled()
})

test('checks several options and keeps them in option order', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <CheckboxGroup
      label="Notify me by"
      name="channels"
      options={OPTIONS}
      onChange={onChange}
    />,
  )

  await userEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))

  expect(onChange).toHaveBeenLastCalledWith(['email', 'sms'])
  expect(screen.getByRole('checkbox', { name: 'Push' })).toBeDisabled()
  expect(
    screen.getByRole('group', { name: 'Notify me by' }),
  ).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('unchecks an option', async () => {
  const onChange = vi.fn()
  render(
    <CheckboxGroup
      label="Notify me by"
      name="channels"
      options={OPTIONS}
      defaultValue={['email', 'sms']}
      onChange={onChange}
    />,
  )

  await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))

  expect(onChange).toHaveBeenLastCalledWith(['sms'])
})
