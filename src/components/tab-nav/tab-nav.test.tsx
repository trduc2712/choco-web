import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'

import type { TabNavItem } from '@/components/tab-nav/tab-nav'
import { TabNav } from '@/components/tab-nav/tab-nav'
import { expectNoA11yViolations } from '@/test/a11y'
import { LOCATION_TEST_ID, renderRoute } from '@/test/router'

const ITEMS: TabNavItem[] = [
  { id: 'home', label: 'Home', to: '/', isEnd: true },
  { id: 'inbox', label: 'Inbox', to: '/inbox', icon: 'inbox', count: 4 },
  { id: 'settings', label: 'Settings', to: '/settings' },
]

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <TabNav label="Sections" items={ITEMS} />
    </MemoryRouter>,
  )
}

test('is a labelled navigation of links', async () => {
  const { container } = renderAt('/inbox')
  const nav = screen.getByRole('navigation', { name: 'Sections' })

  expect(within(nav).getAllByRole('link')).toHaveLength(3)
  expect(within(nav).getByRole('link', { name: /Settings/ })).toHaveAttribute(
    'href',
    '/settings',
  )
  await expectNoA11yViolations(container)
})

test('marks the link of the current page, also on a page below it', () => {
  renderAt('/inbox/42')

  expect(screen.getByRole('link', { name: /Inbox/ })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
  )
})

test('isEnd marks a link only on its own page', () => {
  renderAt('/')

  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.getByRole('link', { name: /Inbox/ })).not.toHaveAttribute(
    'aria-current',
  )
})

test('shows a count next to the label', () => {
  renderAt('/')

  expect(screen.getByRole('link', { name: /Inbox/ })).toHaveTextContent(
    'Inbox4',
  )
})

test('follows a link when it is clicked', async () => {
  renderRoute(<TabNav label="Sections" items={ITEMS} />, { path: '/' })

  await userEvent.click(screen.getByRole('link', { name: 'Settings' }))

  expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
})
