import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expect, test, vi } from 'vitest'

import type { NavListSection } from '@/components/nav-list/nav-list'
import { NavList } from '@/components/nav-list/nav-list'
import { Sidebar } from '@/components/sidebar/sidebar'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const SECTIONS: NavListSection[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Home', to: '/', icon: 'home', isEnd: true },
      { id: 'inbox', label: 'Inbox', to: '/inbox', icon: 'inbox', count: 4 },
    ],
  },
  {
    id: 'shop',
    title: 'Shop',
    items: [
      {
        id: 'products',
        label: 'Products',
        icon: 'package',
        items: [
          { id: 'all', label: 'All products', to: '/products/all' },
          { id: 'new', label: 'New product', to: '/products/new' },
        ],
      },
    ],
  },
]

function renderSidebar(path = '/inbox', onCollapsedChange = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar
        label="Workspace"
        header={<strong>Choco</strong>}
        isCollapsible
        onCollapsedChange={onCollapsedChange}
      >
        {({ isCollapsed }) => (
          <NavList label="Main" sections={SECTIONS} isCollapsed={isCollapsed} />
        )}
      </Sidebar>
    </MemoryRouter>,
  )
}

test('marks the current page and labels sections', async () => {
  const { container } = renderSidebar()
  const nav = screen.getByRole('navigation', { name: 'Main' })

  expect(
    screen.getByRole('complementary', { name: 'Workspace' }),
  ).toBeInTheDocument()
  expect(within(nav).getByRole('link', { name: /Inbox/ })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
  )
  expect(within(nav).getByRole('list', { name: 'Shop' })).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('expands nested items and opens on the current branch', async () => {
  renderSidebar('/products/new')
  const toggle = screen.getByRole('button', { name: 'Products' })

  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link', { name: 'New product' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await userEvent.click(toggle)

  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(
    screen.queryByRole('link', { name: 'New product' }),
  ).not.toBeInTheDocument()
})

test('collapses to icons while keeping link names', async () => {
  const onCollapsedChange = vi.fn()
  renderSidebar('/', onCollapsedChange)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('sidebar.collapse') }),
  )

  expect(onCollapsedChange).toHaveBeenCalledWith(true)
  expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument()
  expect(screen.queryByText('Choco')).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: i18n.t('sidebar.expand') }),
  ).toHaveAttribute('aria-expanded', 'false')
})
