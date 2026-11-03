import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { ScrollArea } from '@/components/scroll-area/scroll-area'
import { expectNoA11yViolations } from '@/test/a11y'

test('a scroll area is a labelled region', async () => {
  const { container } = render(
    <ScrollArea label="Activity" maxHeight="10rem">
      <p>Entry</p>
    </ScrollArea>,
  )
  const region = screen.getByRole('region', { name: 'Activity' })

  expect(region.style.maxHeight).toBe('10rem')
  expect(region).not.toHaveAttribute('tabindex')
  await expectNoA11yViolations(container)
})
