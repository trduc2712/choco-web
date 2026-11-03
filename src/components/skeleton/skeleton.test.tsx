import { render } from '@testing-library/react'
import { expect, test } from 'vitest'

import type { SkeletonShape } from '@/components/skeleton/skeleton'
import { Skeleton } from '@/components/skeleton/skeleton'
import styles from '@/components/skeleton/skeleton.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectNoStyle, expectStyle } from '@/test/styles'

test('is hidden from assistive technology and sized by its props', async () => {
  const { container } = render(
    <Skeleton shape="circle" width="2rem" height="2rem" />,
  )
  const skeleton = container.firstElementChild

  expect(skeleton).toHaveAttribute('aria-hidden', 'true')
  expect(skeleton).toHaveAttribute(
    'style',
    expect.stringContaining('width: 2rem'),
  )
  await expectNoA11yViolations(container)
})

const SHAPES: SkeletonShape[] = ['text', 'rect', 'circle']

test.each(SHAPES)('applies the %s shape', (shape) => {
  const { container } = render(<Skeleton shape={shape} />)

  expectStyle(container.firstElementChild, styles, shape)
})

test('renders one block per line', () => {
  const { container } = render(<Skeleton lines={3} />)

  expectStyle(container.firstElementChild, styles, 'lines')
  expect(container.firstElementChild?.children).toHaveLength(3)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})

test('animates unless told not to', () => {
  const { container } = render(
    <>
      <Skeleton />
      <Skeleton isAnimated={false} />
    </>,
  )
  const [animated, still] = container.children

  expectStyle(animated, styles, 'animated')
  expectNoStyle(still, styles, 'animated')
})
