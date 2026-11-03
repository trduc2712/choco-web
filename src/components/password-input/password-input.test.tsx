import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { PasswordInput } from '@/components/password-input/password-input'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

test('hides the password until asked to show it', async () => {
  const { container } = render(<PasswordInput label="Password" />)
  const input = screen.getByLabelText('Password')
  const toggle = screen.getByRole('button', {
    name: i18n.t('passwordInput.show'),
  })

  expect(input).toHaveAttribute('type', 'password')
  expect(input).toHaveAttribute('autocomplete', 'current-password')
  expect(toggle).toHaveAttribute('aria-pressed', 'false')

  await userEvent.click(toggle)

  expect(input).toHaveAttribute('type', 'text')
  expect(
    screen.getByRole('button', { name: i18n.t('passwordInput.hide') }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expectNoA11yViolations(container)
})

test('accepts a new-password hint', () => {
  render(<PasswordInput label="New password" autoComplete="new-password" />)

  expect(screen.getByLabelText('New password')).toHaveAttribute(
    'autocomplete',
    'new-password',
  )
})
