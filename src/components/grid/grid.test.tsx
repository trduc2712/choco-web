import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Grid } from '@/components/grid/grid'
import { expectStyle } from '@/test/styles'

test('a grid uses fixed columns or fills rows automatically', () => {
  const { rerender } = render(
    <Grid as="ul" columns={3} gap={2} data-testid="grid">
      <li>One</li>
    </Grid>,
  )
  const grid = screen.getByTestId('grid')

  expect(grid.tagName).toBe('UL')
  expectStyle(grid, 'grid', 'columns-3')
  expectStyle(grid, 'grid', 'gap-2')

  rerender(
    <Grid minItemWidth="12rem" data-testid="grid">
      <div>One</div>
    </Grid>,
  )

  expectStyle(screen.getByTestId('grid'), 'grid', 'auto')
  expect(screen.getByTestId('grid').style.getPropertyValue('--grid-min')).toBe(
    '12rem',
  )
})
