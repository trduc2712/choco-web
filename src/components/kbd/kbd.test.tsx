import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Kbd } from '@/components/kbd/kbd'

test('renders a keyboard key', () => {
  render(<Kbd>Esc</Kbd>)

  expect(screen.getByText('Esc').tagName).toBe('KBD')
})
