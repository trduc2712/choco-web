import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'

import { HOME_PATH } from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { NotFoundPage } from '@/pages/not-found-page/not-found-page'

test('shows the not found message with a link back to home', () => {
  render(
    <MemoryRouter initialEntries={['/missing']}>
      <NotFoundPage />
    </MemoryRouter>,
  )

  expect(
    screen.getByRole('heading', { name: i18n.t('notFound.title') }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: i18n.t('notFound.backToHome') }),
  ).toHaveAttribute('href', HOME_PATH)
})
