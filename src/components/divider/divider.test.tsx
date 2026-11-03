import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Divider } from '@/components/divider/divider'
import styles from '@/components/divider/divider.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('is decorative by default', () => {
  render(<Divider />)

  expect(screen.queryByRole('separator')).not.toBeInTheDocument()
})

test('is exposed as a separator when it carries meaning', async () => {
  const { container } = render(
    <Divider isDecorative={false} orientation="vertical" />,
  )

  expect(screen.getByRole('separator')).toHaveAttribute(
    'aria-orientation',
    'vertical',
  )
  await expectNoA11yViolations(container)
})

test('applies the dashed variant', () => {
  const { container } = render(<Divider variant="dashed" />)

  expectStyle(container.firstElementChild, styles, 'dashed')
})

test.each(['horizontal', 'vertical'] as const)(
  'applies the %s orientation',
  (orientation) => {
    const { container } = render(<Divider orientation={orientation} />)

    expectStyle(container.firstElementChild, styles, orientation)
  },
)

test('shows its label between two lines', async () => {
  const { container } = render(<Divider label="Or" />)

  expect(screen.getByText('Or')).toBeInTheDocument()
  expect(container.querySelectorAll(`.${styles.line}`)).toHaveLength(2)
  await expectNoA11yViolations(container)
})

test('stays a separator when it has a label and carries meaning', () => {
  render(<Divider label="Or" isDecorative={false} />)

  expect(screen.getByRole('separator')).toHaveTextContent('Or')
})
