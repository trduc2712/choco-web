import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

test('keeps its content available to assistive technology', () => {
  render(
    <button type="button">
      <VisuallyHidden>Close</VisuallyHidden>
    </button>,
  )

  expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
})

test('passes attributes and class names through', () => {
  render(
    <VisuallyHidden id="status" className="extra" role="status">
      Saved
    </VisuallyHidden>,
  )
  const status = screen.getByRole('status')

  expect(status).toHaveAttribute('id', 'status')
  expect(status).toHaveClass('extra')
})
