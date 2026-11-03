import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type {
  StackAlign,
  StackGap,
  StackJustify,
} from '@/components/stack/stack'
import { Stack } from '@/components/stack/stack'
import styles from '@/components/stack/stack.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectNoStyle, expectStyle } from '@/test/styles'

test('renders its children inside the requested element', async () => {
  const { container } = render(
    <Stack as="ul" direction="row" gap={2}>
      <li>One</li>
      <li>Two</li>
    </Stack>,
  )

  expect(screen.getByRole('list')).toHaveTextContent('OneTwo')
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  await expectNoA11yViolations(container)
})

const GAPS: StackGap[] = [1, 2, 3, 4, 5, 6, 7, 8]
const ALIGNS: StackAlign[] = ['start', 'center', 'end', 'stretch', 'baseline']
const JUSTIFIES: StackJustify[] = ['start', 'center', 'end', 'between']

test.each(['column', 'row'] as const)(
  'applies the %s direction',
  (direction) => {
    const { container } = render(<Stack direction={direction} />)

    expectStyle(container.firstElementChild, styles, direction)
  },
)

test.each(GAPS)('applies gap %i', (gap) => {
  const { container } = render(<Stack gap={gap} />)

  expectStyle(container.firstElementChild, styles, `gap-${gap}`)
})

test.each(ALIGNS)('applies the %s alignment', (align) => {
  const { container } = render(<Stack align={align} />)

  expectStyle(container.firstElementChild, styles, `align-${align}`)
})

test.each(JUSTIFIES)('applies the %s justification', (justify) => {
  const { container } = render(<Stack justify={justify} />)

  expectStyle(container.firstElementChild, styles, `justify-${justify}`)
})

test('wraps only when asked', () => {
  const { container } = render(
    <>
      <Stack />
      <Stack isWrapping />
    </>,
  )
  const [plain, wrapping] = container.children

  expectNoStyle(plain, styles, 'wrap')
  expectStyle(wrapping, styles, 'wrap')
})
