import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'

import { Breadcrumb } from '@/components/breadcrumb/breadcrumb'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

test('links to ancestors and marks the last item as the current page', async () => {
  const { container } = render(
    <MemoryRouter>
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Library', to: '/library' },
          { label: 'Item' },
        ]}
      />
    </MemoryRouter>,
  )
  const nav = screen.getByRole('navigation', {
    name: i18n.t('breadcrumb.label'),
  })

  expect(within(nav).getByRole('link', { name: 'Library' })).toHaveAttribute(
    'href',
    '/library',
  )
  expect(within(nav).getByText('Item')).toHaveAttribute('aria-current', 'page')
  expect(
    within(nav).queryByRole('link', { name: 'Item' }),
  ).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})
