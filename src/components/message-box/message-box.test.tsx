import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { MessageBox } from '@/components/message-box/message-box'
import styles from '@/components/message-box/message-box.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('shows the message and its meta line', async () => {
  const { container } = render(
    <MessageBox meta="#a1b2c3d4">The export button does nothing.</MessageBox>,
  )

  expect(screen.getByText('The export button does nothing.')).toBeVisible()
  expect(screen.getByText('#a1b2c3d4')).toBeVisible()
  await expectNoA11yViolations(container)
})

test('is plain text unless it has an action', () => {
  render(<MessageBox>Plain</MessageBox>)

  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('becomes a button that runs its action', async () => {
  const onClick = vi.fn()
  render(<MessageBox onClick={onClick}>Open me</MessageBox>)

  await userEvent.click(screen.getByRole('button', { name: 'Open me' }))

  expect(onClick).toHaveBeenCalledOnce()
})

test('cuts the message after the given number of lines', () => {
  render(<MessageBox lines={2}>A long message</MessageBox>)

  expectStyle(screen.getByText('A long message'), styles, 'clamped')
})
