import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type {
  BadgeSize,
  BadgeTone,
  BadgeVariant,
} from '@/components/badge/badge'
import { Badge } from '@/components/badge/badge'
import styles from '@/components/badge/badge.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('renders a label', async () => {
  const { container } = render(<Badge tone="success">New</Badge>)

  expect(screen.getByText('New')).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('renders a count', () => {
  render(<Badge count={7} />)

  expect(screen.getByText('7')).toBeInTheDocument()
})

test('caps a count above the maximum', () => {
  render(<Badge count={120} max={99} />)

  expect(
    screen.getByText(i18n.t('badge.overflow', { max: 99 })),
  ).toBeInTheDocument()
})

const TONES: BadgeTone[] = [
  'neutral',
  'primary',
  'info',
  'success',
  'warning',
  'danger',
]
const VARIANTS: BadgeVariant[] = ['subtle', 'solid', 'outline']
const SIZES: BadgeSize[] = ['sm', 'md']

test.each(TONES)('applies the %s tone', (tone) => {
  render(<Badge tone={tone}>New</Badge>)

  expectStyle(screen.getByText('New'), styles, `tone-${tone}`)
})

test.each(VARIANTS)('applies the %s variant', (variant) => {
  render(<Badge variant={variant}>New</Badge>)

  expectStyle(screen.getByText('New'), styles, variant)
})

test.each(SIZES)('applies the %s size', (size) => {
  render(<Badge size={size}>New</Badge>)

  expectStyle(screen.getByText('New'), styles, size)
})

test('shows a decorative icon next to its label', () => {
  render(<Badge icon="check">New</Badge>)

  expect(screen.getByText('New').querySelector('svg')).toHaveAttribute(
    'aria-hidden',
    'true',
  )
})
