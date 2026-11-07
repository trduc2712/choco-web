import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, expect, test, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { RootLayout } from '@/layouts/root-layout'
import { expectNoA11yViolations } from '@/test/a11y'

afterEach(() => {
  onlineManager.setOnline(true)
})

test.each(['light', 'dark'])(
  'announces offline status and resumes paused queries in %s mode',
  async (theme) => {
    const request = vi.fn(async () => 'Request completed')
    const queryClient = new QueryClient()

    function Page() {
      const { data } = useQuery({ queryKey: ['example'], queryFn: request })
      return <main>{data}</main>
    }

    const router = createMemoryRouter([
      { element: <RootLayout />, children: [{ path: '/', element: <Page /> }] },
    ])
    onlineManager.setOnline(false)
    const { container } = render(
      <div data-theme={theme}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </div>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      i18n.t('common.offline'),
    )
    expect(request).not.toHaveBeenCalled()
    expect(queryClient.getQueryState(['example'])?.fetchStatus).toBe('paused')
    await expectNoA11yViolations(container)

    act(() => window.dispatchEvent(new Event('online')))
    expect(await screen.findByText('Request completed')).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    act(() => window.dispatchEvent(new Event('offline')))
    expect(screen.getByRole('alert')).toHaveTextContent(
      i18n.t('common.offline'),
    )
  },
)

test('titles the first page silently and announces and focuses the next heading', async () => {
  const router = createMemoryRouter([
    {
      element: <RootLayout />,
      children: [
        {
          index: true,
          element: (
            <main>
              <h1>Timeline</h1>
            </main>
          ),
        },
        {
          path: '/profile',
          element: (
            <main>
              <h1>Profile</h1>
            </main>
          ),
        },
      ],
    },
  ])

  const { container } = render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )

  const region = container.querySelector('[aria-live="polite"]')
  expect(document.title).toBe('Timeline · Choco')
  expect(region).toBeEmptyDOMElement()
  expect(screen.getByRole('heading', { name: 'Timeline' })).not.toHaveFocus()

  await act(() => router.navigate('/profile'))
  const heading = screen.getByRole('heading', { name: 'Profile' })
  expect(document.title).toBe('Profile · Choco')
  expect(region).toHaveTextContent('Navigated to Profile')
  expect(heading).toHaveFocus()

  heading.blur()
  await act(() => router.navigate('/profile?tab=posts#posts'))
  expect(heading).not.toHaveFocus()

  await act(() => router.navigate(-2))
  expect(document.title).toBe('Timeline · Choco')
  expect(region).toHaveTextContent('Navigated to Timeline')
  expect(screen.getByRole('heading', { name: 'Timeline' })).toHaveFocus()
})

test('waits for a destination heading and updates its title when the heading changes', async () => {
  function Profile() {
    const { t } = useTranslation()
    const [ready, setReady] = useState(false)
    return (
      <main>
        {ready ? (
          <h1>{t('profile.notFound')}</h1>
        ) : (
          <button onClick={() => setReady(true)}>Finish loading</button>
        )}
      </main>
    )
  }

  const router = createMemoryRouter([
    {
      element: <RootLayout />,
      children: [
        {
          index: true,
          element: (
            <main>
              <h1>Timeline</h1>
            </main>
          ),
        },
        { path: '/profile', element: <Profile /> },
      ],
    },
  ])
  const { container } = render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  const region = container.querySelector('[aria-live="polite"]')
  await act(() => router.navigate('/profile'))
  expect(region).toBeEmptyDOMElement()

  await userEvent.click(screen.getByRole('button', { name: 'Finish loading' }))
  const heading = screen.getByRole('heading', { name: 'Profile not found' })
  expect(document.title).toBe('Profile not found · Choco')
  expect(region).toHaveTextContent('Navigated to Profile not found')
  expect(heading).toHaveFocus()

  heading.blur()
  try {
    await act(() => i18n.changeLanguage('vi'))
    expect(document.title).toBe(
      i18n.t('pageNavigation.title', { page: i18n.t('profile.notFound') }),
    )
    expect(region).toHaveTextContent('Navigated to Profile not found')
    expect(heading).not.toHaveFocus()
  } finally {
    await act(() => i18n.changeLanguage('en'))
  }
})
