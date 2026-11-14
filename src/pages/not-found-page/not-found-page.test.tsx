import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { expect, test } from 'vitest'

import { HOME_PATH } from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { NotFoundPage } from '@/pages/not-found-page/not-found-page'

test('shows the not found message with a button back to home', async () => {
  const router = createMemoryRouter(
    [
      { path: HOME_PATH, element: <p>Home</p> },
      { path: '*', element: <NotFoundPage /> },
    ],
    { initialEntries: ['/missing'] },
  )
  render(<RouterProvider router={router} />)

  expect(
    screen.getByRole('heading', { name: i18n.t('notFound.title') }),
  ).toBeInTheDocument()
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('notFound.backToHome') }),
  )
  expect(router.state.location.pathname).toBe(HOME_PATH)
})
