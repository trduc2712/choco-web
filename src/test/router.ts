import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createElement } from 'react'
import { createMemoryRouter, useLocation } from 'react-router'
import { RouterProvider } from 'react-router/dom'

export const LOCATION_TEST_ID = 'location'

function LocationProbe() {
  const { pathname, search } = useLocation()

  return createElement(
    'p',
    { 'data-testid': LOCATION_TEST_ID },
    `${pathname}${search}`,
  )
}

type RenderRouteOptions = {
  path: string
  url?: string
}

/**
 * Renders a route element; navigating anywhere else renders the new location
 * so tests can assert where the page went.
 */
export function renderRoute(
  element: ReactElement,
  { path, url = path }: RenderRouteOptions,
) {
  const router = createMemoryRouter(
    [
      { path, element },
      { path: '*', element: createElement(LocationProbe) },
    ],
    { initialEntries: [url] },
  )

  return { ...render(createElement(RouterProvider, { router })), router }
}
