import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type { SpinnerSize } from '@/components/spinner/spinner'
import { Spinner } from '@/components/spinner/spinner'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectNoStyle, expectStyle } from '@/test/styles'

test('announces the default loading label', async () => {
  const { container } = render(<Spinner />)

  expect(screen.getByRole('status')).toHaveTextContent(i18n.t('common.loading'))
  await expectNoA11yViolations(container)
})

test('announces a custom label', () => {
  render(<Spinner label="Saving" />)

  expect(screen.getByRole('status')).toHaveTextContent('Saving')
})

test('is silent when decorative', () => {
  render(<Spinner isDecorative />)

  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

const SIZES: SpinnerSize[] = ['sm', 'md', 'lg']

test.each(SIZES)('applies the %s size', (size) => {
  render(<Spinner size={size} />)

  expectStyle(screen.getByRole('status').firstElementChild, 'spinner', size)
})

test.each(['primary', 'muted'] as const)('applies the %s tone', (tone) => {
  render(<Spinner tone={tone} />)

  expectStyle(screen.getByRole('status'), 'spinner', tone)
})

test('inherits the surrounding color by default', () => {
  render(<Spinner />)

  expectNoStyle(screen.getByRole('status'), 'spinner', 'primary')
  expectNoStyle(screen.getByRole('status'), 'spinner', 'muted')
})
