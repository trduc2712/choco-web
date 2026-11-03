import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { expect, test, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { RouteErrorPage } from '@/pages/route-error-page/route-error-page'

function BrokenPage(): never {
  throw new Error('boom')
}

test('renders the error screen when a route throws', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  const router = createMemoryRouter([
    { path: '/', element: <BrokenPage />, errorElement: <RouteErrorPage /> },
  ])
  render(<RouterProvider router={router} />)

  expect(
    screen.getByRole('heading', { name: i18n.t('routeError.title') }),
  ).toBeInTheDocument()

  consoleError.mockRestore()
})
