import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Stat } from '@/components/stat/stat'
import styles from '@/components/stat/stat.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('shows a value with its change', async () => {
  const { container } = render(
    <Stat
      label="Revenue"
      value="$12,400"
      change="+8%"
      changeLabel="vs last month"
      trend="up"
    />,
  )
  const [value, change] = screen.getAllByRole('definition')

  expect(screen.getByRole('term')).toHaveTextContent('Revenue')
  expect(value).toHaveTextContent('$12,400')
  expectStyle(change, styles, 'positive')
  await expectNoA11yViolations(container)
})

test('a rising cost can be marked as negative', () => {
  render(
    <Stat
      label="Cost"
      value="$900"
      change="+5%"
      trend="up"
      isTrendPositive={false}
    />,
  )

  expectStyle(screen.getAllByRole('definition')[1], styles, 'negative')
})
