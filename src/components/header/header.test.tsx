import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Header } from '@/components/header/header'

test('renders its children inside the banner', () => {
  render(
    <Header>
      <button type="button">Account</button>
    </Header>,
  )

  expect(
    within(screen.getByRole('banner')).getByRole('button', { name: 'Account' }),
  ).toBeInTheDocument()
})
