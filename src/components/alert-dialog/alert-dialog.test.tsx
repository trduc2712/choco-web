import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

function renderAlertDialog(props: { isConfirming?: boolean } = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  const view = render(
    <AlertDialog
      isOpen
      title="Delete project?"
      description="This cannot be undone."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  )

  return { ...view, onConfirm, onCancel }
}

test('is a labelled alert dialog that focuses the cancel action', async () => {
  const { container } = renderAlertDialog()
  const dialog = screen.getByRole('alertdialog', { name: 'Delete project?' })

  expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
  expect(
    screen.getByRole('button', { name: i18n.t('alertDialog.cancel') }),
  ).toHaveFocus()
  await expectNoA11yViolations(container)
})

test('confirms and cancels', async () => {
  const { onConfirm, onCancel } = renderAlertDialog()

  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('alertDialog.cancel') }),
  )

  expect(onConfirm).toHaveBeenCalledTimes(1)
  expect(onCancel).toHaveBeenCalledTimes(1)
})

test('locks the actions while confirming', () => {
  renderAlertDialog({ isConfirming: true })

  expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute(
    'aria-busy',
    'true',
  )
  expect(
    screen.getByRole('button', { name: i18n.t('alertDialog.cancel') }),
  ).toBeDisabled()
})
