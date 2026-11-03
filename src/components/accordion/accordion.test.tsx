import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Accordion } from '@/components/accordion/accordion'
import { expectNoA11yViolations } from '@/test/a11y'

const ITEMS = [
  {
    id: 'one',
    title: 'First',
    content: 'First content',
    isOpenByDefault: true,
  },
  { id: 'two', title: 'Second', content: 'Second content' },
]

test('opens and closes sections', async () => {
  const { container } = render(<Accordion items={ITEMS} />)
  const [first, second] = screen.getAllByRole('group')

  expect(first).toHaveAttribute('open')
  expect(second).not.toHaveAttribute('open')

  await userEvent.click(screen.getByText('Second'))

  expect(second).toHaveAttribute('open')
  await expectNoA11yViolations(container)
})
