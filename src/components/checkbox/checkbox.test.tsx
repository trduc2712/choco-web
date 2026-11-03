import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Checkbox } from '@/components/checkbox/checkbox'
import styles from '@/components/checkbox/checkbox.module.scss'
import visuallyHiddenStyles from '@/components/visually-hidden/visually-hidden.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('toggles when its label is clicked', async () => {
  const { container } = render(
    <Checkbox label="Remember this choice" hint="You can change it later" />,
  )
  const checkbox = screen.getByRole('checkbox', {
    name: 'Remember this choice',
  })

  await userEvent.click(screen.getByText('Remember this choice'))

  expect(checkbox).toBeChecked()
  expect(checkbox).toHaveAccessibleDescription('You can change it later')
  await expectNoA11yViolations(container)
})

test('toggles with the keyboard', async () => {
  render(<Checkbox label="Remember this choice" />)

  await userEvent.tab()
  await userEvent.keyboard(' ')

  expect(screen.getByRole('checkbox')).toBeChecked()
})

test('can be partially checked', () => {
  render(<Checkbox label="Select all" isIndeterminate />)

  expect(screen.getByRole('checkbox')).toBePartiallyChecked()
})

test('marks itself invalid', () => {
  render(<Checkbox label="Accept" isInvalid />)

  expect(screen.getByRole('checkbox')).toBeInvalid()
})

test('cannot be toggled while disabled', async () => {
  render(<Checkbox label="Accept" disabled />)
  const checkbox = screen.getByRole('checkbox')

  await userEvent.click(checkbox)

  expect(checkbox).toBeDisabled()
  expect(checkbox).not.toBeChecked()
})

test('shows a dash while partially checked and a check otherwise', () => {
  const { container, rerender } = render(<Checkbox label="All" />)
  const box = container.querySelector(`.${styles.box}`)
  const checkPath = box?.querySelector('path')?.getAttribute('d')

  rerender(<Checkbox label="All" isIndeterminate />)

  expectStyle(box, styles, 'box')
  expect(box?.querySelector('path')).not.toHaveAttribute('d', checkPath)
})

test('can hide its label visually while keeping its name', () => {
  render(<Checkbox label="Select row" isLabelHidden />)

  expect(
    screen.getByRole('checkbox', { name: 'Select row' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Select row')).toHaveClass(visuallyHiddenStyles.root)
})
