import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Timeline } from '@/components/timeline/timeline'
import styles from '@/components/timeline/timeline.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('lists events in order with machine-readable times', async () => {
  const { container } = render(
    <Timeline
      label="Order history"
      items={[
        {
          id: 'placed',
          title: 'Order placed',
          time: 'Mar 2',
          dateTime: '2026-03-02',
        },
        {
          id: 'shipped',
          title: 'Shipped',
          time: 'Mar 3',
          tone: 'success',
          icon: 'truck',
        },
      ]}
    />,
  )
  const items = screen.getAllByRole('listitem')

  expect(
    screen.getByRole('list', { name: 'Order history' }),
  ).toBeInTheDocument()
  expect(items[0].querySelector('time')).toHaveAttribute(
    'datetime',
    '2026-03-02',
  )
  expectStyle(items[1], styles, 'success')
  await expectNoA11yViolations(container)
})
