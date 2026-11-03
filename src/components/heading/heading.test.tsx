import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type {
  HeadingAlign,
  HeadingLevel,
  HeadingSize,
} from '@/components/heading/heading'
import { Heading } from '@/components/heading/heading'
import styles from '@/components/heading/heading.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('renders the semantic level independently of its visual size', async () => {
  const { container } = render(
    <Heading level={2} size="sm">
      Title
    </Heading>,
  )

  expect(
    screen.getByRole('heading', { level: 2, name: 'Title' }),
  ).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

const DEFAULT_SIZES: [HeadingLevel, HeadingSize][] = [
  [1, '3xl'],
  [2, '2xl'],
  [3, 'xl'],
  [4, 'lg'],
  [5, 'md'],
  [6, 'sm'],
]
const ALIGNS: HeadingAlign[] = ['start', 'center', 'end']

test.each(DEFAULT_SIZES)('level %i defaults to the %s size', (level, size) => {
  render(<Heading level={level}>Title</Heading>)

  expectStyle(screen.getByRole('heading', { level }), styles, `size-${size}`)
})

test.each(ALIGNS)('applies the %s alignment', (align) => {
  render(
    <Heading level={2} align={align}>
      Title
    </Heading>,
  )

  expectStyle(screen.getByRole('heading'), styles, `align-${align}`)
})

test('applies the muted tone', () => {
  render(
    <Heading level={2} tone="muted">
      Title
    </Heading>,
  )

  expectStyle(screen.getByRole('heading'), styles, 'muted')
})
