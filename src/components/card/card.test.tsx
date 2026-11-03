import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type { CardPadding, CardVariant } from '@/components/card/card'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/card/card'
import styles from '@/components/card/card.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('renders its parts inside the requested element', async () => {
  const { container } = render(
    <Card as="article" aria-label="Post">
      <CardHeader>Header</CardHeader>
      <CardBody>Body</CardBody>
      <CardFooter>Footer</CardFooter>
    </Card>,
  )

  const article = screen.getByRole('article', { name: 'Post' })

  expect(article).toHaveTextContent('HeaderBodyFooter')
  await expectNoA11yViolations(container)
})

const VARIANTS: CardVariant[] = ['outlined', 'elevated', 'filled']
const PADDINGS: CardPadding[] = ['sm', 'md', 'lg']

test.each(VARIANTS)('applies the %s variant', (variant) => {
  const { container } = render(<Card variant={variant} />)

  expectStyle(container.firstElementChild, styles, variant)
})

test.each(PADDINGS)('applies the %s padding', (padding) => {
  const { container } = render(<Card padding={padding} />)

  expectStyle(container.firstElementChild, styles, `padding-${padding}`)
})
