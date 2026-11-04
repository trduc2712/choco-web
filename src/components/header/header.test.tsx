import { render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { Header } from '@/components/header/header'

const ACCOUNT_MENU = 'account-menu'

vi.mock('@/features/auth/account-menu', () => ({
  AccountMenu: () => <div data-testid={ACCOUNT_MENU} />,
}))

test('renders the account menu inside the banner', () => {
  render(<Header />)

  expect(
    within(screen.getByRole('banner')).getByTestId(ACCOUNT_MENU),
  ).toBeInTheDocument()
})
