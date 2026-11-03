import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { CopyButton } from '@/components/copy-button/copy-button'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

test('copies its value and announces it', async () => {
  const user = userEvent.setup()
  const onCopy = vi.fn()
  const { container } = render(
    <CopyButton value="copy-value" onCopy={onCopy} />,
  )

  await user.click(
    screen.getByRole('button', { name: i18n.t('copyButton.copy') }),
  )

  expect(await navigator.clipboard.readText()).toBe('copy-value')
  expect(screen.getByRole('status')).toHaveTextContent(
    i18n.t('copyButton.copied'),
  )
  expect(onCopy).toHaveBeenCalled()
  await expectNoA11yViolations(container)
})

test('can show its label', async () => {
  const user = userEvent.setup()
  render(<CopyButton value="x" label="Copy code" isLabelShown />)

  await user.click(screen.getByRole('button', { name: 'Copy code' }))

  expect(
    screen.getByRole('button', { name: i18n.t('copyButton.copied') }),
  ).toBeInTheDocument()
})
