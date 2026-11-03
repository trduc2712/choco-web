import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Switch } from '@/components/switch/switch'
import styles from '@/components/switch/switch.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectNoStyle, expectStyle } from '@/test/styles'

test('turns on and off', async () => {
  const { container } = render(<Switch label="Notifications" />)
  const control = screen.getByRole('switch', { name: 'Notifications' })

  expect(control).not.toBeChecked()

  await userEvent.click(control)

  expect(control).toBeChecked()
  await expectNoA11yViolations(container)
})

test('toggles with the keyboard', async () => {
  render(<Switch label="Notifications" defaultChecked />)

  await userEvent.tab()
  await userEvent.keyboard(' ')

  expect(screen.getByRole('switch')).not.toBeChecked()
})

test('can put its label before the control', () => {
  const { container } = render(
    <>
      <Switch label="After" />
      <Switch label="Before" labelPosition="start" />
    </>,
  )
  const [after, before] = container.children

  expectNoStyle(after, styles, 'end')
  expectStyle(before, styles, 'end')
})

test('cannot be toggled while disabled', async () => {
  render(<Switch label="Notifications" disabled />)
  const control = screen.getByRole('switch')

  await userEvent.click(control)

  expect(control).toBeDisabled()
  expect(control).not.toBeChecked()
})
