import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, expect, test } from 'vitest'

import { ToastProvider } from '@/components'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { DesignSystemPage } from '@/pages/design-system-page/design-system-page'
import { getEntryDocs } from '@/pages/design-system-page/entry-docs'
import {
  getEntriesInGroup,
  getEntryPath,
  SHOWCASE_ENTRIES,
  SHOWCASE_GROUPS,
} from '@/pages/design-system-page/showcase-entries'
import { expectNoA11yViolations } from '@/test/a11y'

const ENTRY_IDS = SHOWCASE_ENTRIES.map(({ id }) => id)

const ds = i18n.getFixedT(null, 'designSystem')

function renderPage(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: `${DESIGN_SYSTEM_PATH}/:entryId?`,
        element: <DesignSystemPage />,
      },
    ],
    { initialEntries: [path] },
  )

  return {
    router,
    ...render(
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>,
    ),
  }
}

function getSidebar() {
  return screen.getAllByRole('navigation', { name: ds('nav.label') })[0]
}

function getSearchInput() {
  return screen.getByRole('combobox', { name: ds('search.label') })
}

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

test('shows the overview when no entry is given', () => {
  renderPage(DESIGN_SYSTEM_PATH)

  expect(
    screen.getByRole('heading', { level: 1, name: ds('overview.title') }),
  ).toBeInTheDocument()

  for (const group of SHOWCASE_GROUPS) {
    const section = screen.getByRole('region', { name: ds(`groups.${group}`) })

    expect(
      within(section)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(getEntriesInGroup(group).map((entry) => getEntryPath(entry.id)))
  }
})

test('describes every entry on its overview card', () => {
  renderPage(DESIGN_SYSTEM_PATH)

  const actions = screen.getByRole('region', { name: ds('groups.actions') })
  const card = within(actions).getByRole('link', { name: /^Button/ })

  expect(card).toHaveTextContent(getEntryDocs('button', 'en').description)
})

test.each(SHOWCASE_GROUPS)('lists every %s entry in the sidebar', (group) => {
  renderPage(getEntryPath('button'))

  const list = within(getSidebar()).getByRole('list', {
    name: ds(`groups.${group}`),
  })

  expect(
    within(list)
      .getAllByRole('link')
      .map((link) => link.textContent),
  ).toEqual(getEntriesInGroup(group).map((entry) => entry.name))
})

test('shows the entry chosen in the sidebar and marks it as current', async () => {
  renderPage(getEntryPath('button'))

  await userEvent.click(
    within(getSidebar()).getByRole('link', { name: 'Badge' }),
  )

  expect(screen.getByRole('heading', { level: 1, name: 'Badge' })).toHaveFocus()
  expect(
    within(getSidebar()).getByRole('link', { name: 'Badge' }),
  ).toHaveAttribute('aria-current', 'page')
  expect(
    within(getSidebar()).getByRole('link', { name: 'Button' }),
  ).not.toHaveAttribute('aria-current')
})

test('opens the navigation drawer from the header', async () => {
  renderPage(getEntryPath('button'))

  await userEvent.click(screen.getByRole('button', { name: ds('docs.menu') }))

  const drawer = screen.getByRole('dialog', { name: ds('nav.label') })

  await userEvent.click(within(drawer).getByRole('link', { name: 'Tabs' }))

  expect(screen.getByRole('heading', { level: 1, name: 'Tabs' })).toBeVisible()
  expect(
    screen.queryByRole('dialog', { name: ds('nav.label') }),
  ).not.toBeInTheDocument()
})

test('jumps to an entry from the search', async () => {
  const { router } = renderPage(getEntryPath('button'))

  await userEvent.click(
    screen.getByRole('button', { name: ds('search.label') }),
  )
  await userEvent.type(getSearchInput(), 'skel{Enter}')

  expect(
    screen.getByRole('heading', { level: 1, name: 'Skeleton' }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe(getEntryPath('skeleton'))
})

test('opens the search with the keyboard shortcut', async () => {
  renderPage(getEntryPath('button'))

  await userEvent.keyboard('{Control>}k{/Control}')

  expect(
    screen.getByRole('dialog', { name: ds('search.label') }),
  ).toHaveAttribute('open')
})

test('moves through search results with the arrow keys', async () => {
  const { router } = renderPage(getEntryPath('button'))

  await userEvent.click(
    screen.getByRole('button', { name: ds('search.label') }),
  )
  await userEvent.type(getSearchInput(), 'tab')

  const [first, second] = screen.getAllByRole('option')

  expect(first).toHaveAttribute('aria-selected', 'true')
  expect(within(first).getByText('Table')).toBeInTheDocument()
  expect(within(second).getByText('Tabs')).toBeInTheDocument()

  await userEvent.keyboard('{ArrowDown}')

  expect(getSearchInput()).toHaveAttribute('aria-activedescendant', second.id)

  await userEvent.keyboard('{Enter}')

  expect(router.state.location.pathname).toBe(getEntryPath('tabs'))
})

test('tells when the search finds nothing', async () => {
  renderPage(getEntryPath('button'))

  await userEvent.click(
    screen.getByRole('button', { name: ds('search.label') }),
  )
  await userEvent.type(getSearchInput(), 'zzz')

  expect(
    screen.getByText(i18n.t('commandPalette.empty', { query: 'zzz' })),
  ).toHaveAttribute('role', 'status')
})

test('shows how to use a component with its source code', () => {
  renderPage(getEntryPath('button'))

  const usage = screen.getByRole('group', { name: i18n.t('codeBlock.label') })

  expect(usage).toHaveTextContent(
    "import { Button, Stack } from '@/components'",
  )
  expect(usage).toHaveTextContent('<Button')
})

test('shows how to use tokens with a stylesheet', () => {
  renderPage(getEntryPath('colors'))

  expect(
    screen.getByRole('group', { name: i18n.t('codeBlock.label') }),
  ).toHaveTextContent('background: var(--color-primary-subtle);')
})

test('shows the import line of a component', () => {
  renderPage(getEntryPath('card'))

  expect(
    screen.getByText(
      (_, element) =>
        element?.tagName === 'CODE' &&
        element.textContent ===
          "import { Card, CardBody, CardFooter, CardHeader } from '@/components'",
    ),
  ).toBeInTheDocument()
})

test('copies the usage code', async () => {
  const user = userEvent.setup()
  renderPage(getEntryPath('spinner'))

  const [, copyCode] = screen.getAllByRole('button', {
    name: i18n.t('codeBlock.copy'),
  })
  await user.click(copyCode)

  expect(await navigator.clipboard.readText()).toContain(
    "import { Spinner } from '@/components'",
  )
  expect(
    await screen.findByText(i18n.t('copyButton.copied')),
  ).toBeInTheDocument()
})

test('expands long code examples', async () => {
  renderPage(getEntryPath('button'))

  const toggle = screen.getByRole('button', {
    name: i18n.t('codeBlock.expand'),
  })

  expect(toggle).toHaveAttribute('aria-expanded', 'false')

  await userEvent.click(toggle)

  expect(
    screen.getByRole('button', { name: i18n.t('codeBlock.collapse') }),
  ).toHaveAttribute('aria-expanded', 'true')
})

test('documents guidelines, accessibility and props', () => {
  renderPage(getEntryPath('button'))

  const docs = getEntryDocs('button', 'en')

  for (const title of [
    ds('docs.examples'),
    ds('docs.guidelines'),
    ds('docs.accessibility'),
    ds('docs.api'),
  ]) {
    expect(
      screen.getByRole('heading', { level: 2, name: title }),
    ).toBeInTheDocument()
  }

  expect(screen.getByText(docs.whenToUse[0])).toBeInTheDocument()
  expect(screen.getByText(docs.whenNotToUse[0])).toBeInTheDocument()
  expect(screen.getByText(docs.accessibility[0])).toBeInTheDocument()

  const api = screen.getByRole('region', { name: ds('docs.api') })

  expect(
    within(api)
      .getAllByRole('rowheader')
      .map((cell) => cell.querySelector('code')?.textContent),
  ).toEqual(docs.props?.map((prop) => prop.name))
})

test('lists the sections of the entry on the page', () => {
  renderPage(getEntryPath('button'))

  const toc = screen.getByRole('navigation', { name: ds('docs.onThisPage') })

  expect(
    within(toc).getByRole('link', { name: ds('docs.api') }),
  ).toHaveAttribute('href', '#api-reference')
  expect(within(toc).getByRole('link', { name: 'Variants' })).toHaveAttribute(
    'href',
    '#variants',
  )
})

test('links to the previous and next entries', () => {
  renderPage(getEntryPath('button'))

  const pager = screen.getByRole('navigation', { name: ds('docs.pager') })

  expect(within(pager).getByRole('link', { name: /Shadows/ })).toHaveAttribute(
    'href',
    getEntryPath('shadows'),
  )
  expect(
    within(pager).getByRole('link', { name: /CopyButton/ }),
  ).toHaveAttribute('href', getEntryPath('copy-button'))
})

test('filters the icon set and copies an icon', async () => {
  const user = userEvent.setup()
  renderPage(getEntryPath('icon'))

  await user.type(
    screen.getByRole('searchbox', { name: ds('samples.iconSearch') }),
    'cloud-up',
  )

  const tiles = screen.getAllByRole('button', { name: /^cloud-up/ })

  expect(tiles.map((tile) => tile.textContent)).toEqual(['cloud-upload'])

  await user.click(tiles[0])

  expect(await navigator.clipboard.readText()).toBe(
    '<Icon name="cloud-upload" />',
  )
  expect(await screen.findByText(ds('samples.iconCopied'))).toBeInTheDocument()
})

test('explains when the entry does not exist', () => {
  renderPage(getEntryPath('nope'))

  expect(
    screen.getByRole('heading', { level: 1, name: ds('notFound.title') }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: ds('notFound.action') }),
  ).toHaveAttribute('href', DESIGN_SYSTEM_PATH)
})

test('switches the theme from the header', async () => {
  renderPage(getEntryPath('button'))

  await userEvent.click(
    screen.getAllByRole('button', { name: i18n.t('theme.label') })[0],
  )
  await userEvent.click(
    screen.getByRole('menuitemradio', { name: i18n.t('theme.dark') }),
  )

  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
})

test('documents every entry', () => {
  for (const { id } of SHOWCASE_ENTRIES) {
    const docs = getEntryDocs(id, 'en')

    expect(docs.description, id).not.toBe('')
    expect(docs.whenToUse.length, id).toBeGreaterThan(0)
    expect(docs.whenNotToUse.length, id).toBeGreaterThan(0)
    expect(docs.accessibility.length, id).toBeGreaterThan(0)
  }
})

test('renders the overview without accessibility violations', async () => {
  const { container } = renderPage(DESIGN_SYSTEM_PATH)

  await expectNoA11yViolations(container)
})

test.each(ENTRY_IDS)(
  'renders the %s entry without accessibility violations',
  async (id) => {
    const { container } = renderPage(getEntryPath(id))

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: SHOWCASE_ENTRIES.find((entry) => entry.id === id)?.name,
      }),
    ).toBeInTheDocument()
    await expectNoA11yViolations(container)
  },
)
