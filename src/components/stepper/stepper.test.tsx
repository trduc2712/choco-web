import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Stepper } from '@/components/stepper/stepper'
import styles from '@/components/stepper/stepper.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

const STEPS = [
  { id: 'cart', label: 'Cart' },
  { id: 'shipping', label: 'Shipping', description: 'Where to send it' },
  { id: 'payment', label: 'Payment' },
]

test('marks the current step and announces each status', async () => {
  const { container } = render(<Stepper steps={STEPS} currentIndex={1} />)
  const nav = screen.getByRole('navigation', { name: i18n.t('stepper.label') })
  const items = within(nav).getAllByRole('listitem')

  expect(items[1]).toHaveAttribute('aria-current', 'step')
  expect(items[0]).toHaveTextContent(`Cart, ${i18n.t('stepper.complete')}`)
  expect(items[2]).toHaveTextContent(`Payment, ${i18n.t('stepper.upcoming')}`)
  await expectNoA11yViolations(container)
})

test('lets people go back to completed steps', async () => {
  const onStepClick = vi.fn()
  render(<Stepper steps={STEPS} currentIndex={2} onStepClick={onStepClick} />)

  await userEvent.click(screen.getByRole('button', { name: /^Shipping/ }))

  expect(onStepClick).toHaveBeenCalledWith(1)
  expect(screen.getAllByRole('button')).toHaveLength(2)
})

test('can be vertical', () => {
  render(<Stepper steps={STEPS} currentIndex={0} orientation="vertical" />)

  expectStyle(screen.getByRole('navigation'), styles, 'vertical')
})
