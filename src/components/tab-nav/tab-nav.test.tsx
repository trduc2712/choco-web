import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { expect, test, vi } from 'vitest'

import type { TabNavItem } from '@/components/tab-nav/tab-nav'
import { TabNav } from '@/components/tab-nav/tab-nav'
import styles from '@/components/tab-nav/tab-nav.module.scss'
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

// jsdom has no layout and does not scroll, so a test gives the list the sizes
// of a row too narrow for its links, and a scroll position of its own.
function fakeOverflow(scrollLeft: number) {
  const list = screen.getByRole('list')

  Object.defineProperties(list, {
    clientWidth: { configurable: true, value: 100 },
    scrollWidth: { configurable: true, value: 300 },
    scrollLeft: { configurable: true, writable: true, value: scrollLeft },
  })

  return list
}

test('fades each end that has links past it', () => {
  renderAt('/')
  const nav = screen.getByRole('navigation')
  const list = fakeOverflow(0)

  fireEvent.scroll(list)

  expect(nav).not.toHaveClass(styles.atStart)
  expect(nav).toHaveClass(styles.atEnd)

  list.scrollLeft = 100
  fireEvent.scroll(list)

  expect(nav).toHaveClass(styles.atStart)
  expect(nav).toHaveClass(styles.atEnd)

  list.scrollLeft = 200
  fireEvent.scroll(list)

  expect(nav).toHaveClass(styles.atStart)
  expect(nav).not.toHaveClass(styles.atEnd)
})

test('scrolls a cut-off current link to the middle of the row', () => {
  const setScrollLeft = vi.spyOn(Element.prototype, 'scrollLeft', 'set')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      // The row is 0 to 100 wide; the current link sits at 150 to 190.
      return this.tagName === 'UL'
        ? DOMRect.fromRect({ x: 0, width: 100 })
        : DOMRect.fromRect({ x: 150, width: 40 })
    },
  )

  renderAt('/settings')

  // Its middle, 170, moves to the row's middle, 50.
  expect(setScrollLeft).toHaveBeenCalledWith(120)
  vi.restoreAllMocks()
})

test('follows a link when it is clicked', async () => {
  renderRoute(<TabNav label="Sections" items={ITEMS} />, { path: '/' })

  await userEvent.click(screen.getByRole('link', { name: 'Settings' }))

  expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/settings')
})
