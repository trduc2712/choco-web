import { render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { Header } from '@/components/header/header'

const USER_BUTTON = 'user-button'

vi.mock('@clerk/react', () => ({
  UserButton: () => <div data-testid={USER_BUTTON} />,
}))

test('renders the user menu inside the banner', () => {
  render(<Header />)

  expect(
    within(screen.getByRole('banner')).getByTestId(USER_BUTTON),
  ).toBeInTheDocument()
})
