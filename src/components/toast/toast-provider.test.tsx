import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'

import { Button } from '@/components/button/button'
import type { ToastOptions } from '@/components/toast/toast-context'
import { ToastProvider } from '@/components/toast/toast-provider'
import { useToast } from '@/components/toast/use-toast'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

function Trigger({ options }: { options: ToastOptions }) {
  const { showToast } = useToast()

  return <Button onClick={() => showToast(options)}>Notify</Button>
}

function renderToast(options: ToastOptions) {
  return render(
    <ToastProvider>
      <Trigger options={options} />
    </ToastProvider>,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

test('announces a toast politely', async () => {
  const { container } = renderToast({
    title: 'Saved',
    description: 'All changes are stored.',
  })

  await userEvent.click(screen.getByRole('button', { name: 'Notify' }))

  expect(screen.getByRole('status')).toHaveTextContent(
    'SavedAll changes are stored.',
  )
  await expectNoA11yViolations(container)
})

test('announces a danger toast assertively', async () => {
  renderToast({ title: 'Could not save', tone: 'danger' })

  await userEvent.click(screen.getByRole('button', { name: 'Notify' }))

  expect(screen.getByRole('alert')).toHaveTextContent('Could not save')
})

test('can be dismissed', async () => {
  renderToast({ title: 'Saved', duration: null })

  await userEvent.click(screen.getByRole('button', { name: 'Notify' }))
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.dismiss') }),
  )

  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('dismisses itself after its duration', () => {
  vi.useFakeTimers()
  renderToast({ title: 'Saved', duration: 1000 })

  act(() => screen.getByRole('button', { name: 'Notify' }).click())

  expect(screen.getByRole('status')).toBeInTheDocument()

  act(() => vi.advanceTimersByTime(1000))

  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('requires a provider', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  expect(() => render(<Trigger options={{ title: 'Saved' }} />)).toThrow()

  consoleError.mockRestore()
})
