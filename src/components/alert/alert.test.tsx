import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { AlertTone, AlertVariant } from '@/components/alert/alert'
import { Alert } from '@/components/alert/alert'
import styles from '@/components/alert/alert.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('shows its title and message', async () => {
  const { container } = render(
    <Alert tone="success" title="Saved">
      Your changes are live.
    </Alert>,
  )

  expect(screen.getByText('Saved')).toBeInTheDocument()
  expect(screen.getByText('Your changes are live.')).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('can interrupt as an alert', () => {
  render(<Alert tone="danger" role="alert" title="Could not save" />)

  expect(screen.getByRole('alert')).toHaveTextContent('Could not save')
})

test('can be dismissed', async () => {
  const onDismiss = vi.fn()
  render(<Alert title="Heads up" onDismiss={onDismiss} />)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.dismiss') }),
  )

  expect(onDismiss).toHaveBeenCalledTimes(1)
})

const TONES: AlertTone[] = ['info', 'success', 'warning', 'danger']
const VARIANTS: AlertVariant[] = ['subtle', 'outline']

test.each(TONES)('applies the %s tone', (tone) => {
  const { container } = render(<Alert tone={tone} title="Heads up" />)

  expectStyle(container.firstElementChild, styles, tone)
})

test.each(VARIANTS)('applies the %s variant', (variant) => {
  const { container } = render(<Alert variant={variant} title="Heads up" />)

  expectStyle(container.firstElementChild, styles, variant)
})

test('has no dismiss button unless it can be dismissed', () => {
  render(<Alert title="Heads up" />)

  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
