import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type {
  TextAlign,
  TextSize,
  TextTone,
  TextWeight,
} from '@/components/text/text'
import { Text } from '@/components/text/text'
import styles from '@/components/text/text.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectNoStyle, expectStyle } from '@/test/styles'

test('renders a paragraph by default', async () => {
  const { container } = render(<Text>Hello</Text>)

  expect(screen.getByText('Hello').tagName).toBe('P')
  await expectNoA11yViolations(container)
})

test('renders the requested element', () => {
  render(<Text as="strong">Hello</Text>)

  expect(screen.getByText('Hello').tagName).toBe('STRONG')
})

const SIZES: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const WEIGHTS: TextWeight[] = ['regular', 'medium', 'semibold']
const TONES: TextTone[] = [
  'default',
  'muted',
  'primary',
  'info',
  'success',
  'warning',
  'danger',
]
const ALIGNS: TextAlign[] = ['start', 'center', 'end']

test.each(SIZES)('applies the %s size', (size) => {
  render(<Text size={size}>Hello</Text>)

  expectStyle(screen.getByText('Hello'), styles, `size-${size}`)
})

test.each(WEIGHTS)('applies the %s weight', (weight) => {
  render(<Text weight={weight}>Hello</Text>)

  expectStyle(screen.getByText('Hello'), styles, `weight-${weight}`)
})

test.each(TONES)('applies the %s tone', (tone) => {
  render(<Text tone={tone}>Hello</Text>)

  expectStyle(screen.getByText('Hello'), styles, `tone-${tone}`)
})

test.each(ALIGNS)('applies the %s alignment', (align) => {
  render(<Text align={align}>Hello</Text>)

  expectStyle(screen.getByText('Hello'), styles, `align-${align}`)
})

test('truncates only when asked', () => {
  render(
    <>
      <Text>Whole</Text>
      <Text isTruncated>Cut</Text>
    </>,
  )

  expectNoStyle(screen.getByText('Whole'), styles, 'truncated')
  expectStyle(screen.getByText('Cut'), styles, 'truncated')
})
