import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type { ProgressTone } from '@/components/progress/progress'
import { Progress } from '@/components/progress/progress'
import styles from '@/components/progress/progress.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectNoStyle, expectStyle } from '@/test/styles'

test('reports its value', async () => {
  const { container } = render(<Progress label="Upload" value={40} />)
  const bar = screen.getByRole('progressbar', { name: 'Upload' })

  expect(bar).toHaveAttribute('aria-valuenow', '40')
  expect(bar).toHaveAttribute('aria-valuemax', '100')
  await expectNoA11yViolations(container)
})

test('clamps values above the maximum', () => {
  render(<Progress label="Upload" value={15} max={10} isValueShown />)

  expect(screen.getByRole('progressbar')).toHaveAttribute(
    'aria-valuetext',
    '100%',
  )
})

test('has no value while indeterminate', async () => {
  const { container } = render(<Progress label="Loading" isLabelHidden />)

  expect(
    screen.getByRole('progressbar', { name: 'Loading' }),
  ).not.toHaveAttribute('aria-valuenow')
  await expectNoA11yViolations(container)
})

const TONES: ProgressTone[] = ['primary', 'success', 'danger']

test.each(TONES)('applies the %s tone', (tone) => {
  const { container } = render(
    <Progress label="Upload" value={40} tone={tone} />,
  )

  expectStyle(container.firstElementChild, styles, tone)
})

test('shows the value as text when asked', () => {
  render(<Progress label="Upload" value={40} isValueShown />)

  expect(screen.getByText('40%')).toBeInTheDocument()
})

test('sizes the fill to the value and animates when indeterminate', () => {
  const { rerender } = render(<Progress label="Upload" value={40} />)
  const fill = screen.getByRole('progressbar').firstElementChild

  expect(fill).toHaveAttribute('style', expect.stringContaining('width: 40%'))
  expectNoStyle(fill, styles, 'indeterminate')

  rerender(<Progress label="Upload" />)

  expectStyle(
    screen.getByRole('progressbar').firstElementChild,
    styles,
    'indeterminate',
  )
})
