import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { SkipLink } from '@/components/skip-link/skip-link'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

test('is the first stop and moves focus to the main content', async () => {
  const { container } = render(
    <>
      <SkipLink targetId="main" />
      <nav>
        <a href="/home">Home</a>
      </nav>
      <main id="main">Content</main>
    </>,
  )
  const link = screen.getByRole('link', { name: i18n.t('skipLink.label') })

  await userEvent.tab()

  expect(link).toHaveFocus()
  expect(link).toHaveAttribute('href', '#main')

  await userEvent.click(link)

  expect(screen.getByRole('main')).toHaveFocus()
  expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
  await expectNoA11yViolations(container)
})
