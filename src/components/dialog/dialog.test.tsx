import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { DialogSize } from '@/components/dialog/dialog'
import { Dialog } from '@/components/dialog/dialog'
import styles from '@/components/dialog/dialog.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('is not exposed while closed', () => {
  render(<Dialog isOpen={false} onClose={vi.fn()} title="Confirm" />)

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('is named by its title and described by its description', async () => {
  const { container } = render(
    <Dialog
      isOpen
      onClose={vi.fn()}
      title="Confirm"
      description="This cannot be undone."
    >
      Body
    </Dialog>,
  )
  const dialog = screen.getByRole('dialog', { name: 'Confirm' })

  expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
  expect(dialog).toHaveTextContent('Body')
  await expectNoA11yViolations(container)
})

test('asks to close from the close button', async () => {
  const onClose = vi.fn()
  render(<Dialog isOpen onClose={onClose} title="Confirm" />)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.close') }),
  )

  expect(onClose).toHaveBeenCalledTimes(1)
})

test('closes when isOpen becomes false', () => {
  const { rerender } = render(
    <Dialog isOpen onClose={vi.fn()} title="Confirm" />,
  )

  rerender(<Dialog isOpen={false} onClose={vi.fn()} title="Confirm" />)

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

const SIZES: DialogSize[] = ['sm', 'md', 'lg']

test.each(SIZES)('applies the %s size', (size) => {
  render(<Dialog isOpen size={size} onClose={vi.fn()} title="Confirm" />)

  expectStyle(screen.getByRole('dialog'), styles, size)
})

test('shows its footer actions', () => {
  render(
    <Dialog
      isOpen
      onClose={vi.fn()}
      title="Confirm"
      footer={<button type="button">Delete</button>}
    />,
  )

  expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
})

test('asks to close when the backdrop is clicked', async () => {
  const onClose = vi.fn()
  render(
    <Dialog isOpen onClose={onClose} title="Confirm">
      Body
    </Dialog>,
  )

  await userEvent.click(screen.getByText('Body'))

  expect(onClose).not.toHaveBeenCalled()

  await userEvent.click(screen.getByRole('dialog'))

  expect(onClose).toHaveBeenCalledTimes(1)
})
