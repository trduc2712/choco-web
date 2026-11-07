import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
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
