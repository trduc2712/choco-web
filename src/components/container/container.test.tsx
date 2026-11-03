import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type { ContainerSize } from '@/components/container/container'
import { Container } from '@/components/container/container'
import styles from '@/components/container/container.module.scss'
import { expectNoStyle, expectStyle } from '@/test/styles'

test('renders its children inside the requested element', () => {
  render(<Container as="main">Content</Container>)

  expect(screen.getByRole('main')).toHaveTextContent('Content')
})

const SIZES: ContainerSize[] = ['sm', 'md', 'lg']

test.each(SIZES)('applies the %s size', (size) => {
  const { container } = render(<Container size={size} />)

  expectStyle(container.firstElementChild, styles, size)
})

test('has no maximum width when full', () => {
  const { container } = render(<Container size="full" />)

  SIZES.forEach((size) =>
    expectNoStyle(container.firstElementChild, styles, size),
  )
})
