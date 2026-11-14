import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, expect, test, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'

import { PERMISSIONS } from './permissions'
import { RequirePermission } from './require-permission'
import type { Permissions } from './use-permissions'

const usePermissions = vi.fn<() => Permissions>()

vi.mock('./use-permissions', () => ({
  usePermissions: () => usePermissions(),
}))

function permissions(granted: string[], isLoading = false): Permissions {
  return {
    isLoading,
    granted,
    can: (permission) => granted.includes(permission),
    canAny: (list) => list.some((permission) => granted.includes(permission)),
  }
}

function renderGuard(
  permission: Parameters<typeof RequirePermission>[0]['permission'],
  loading?: ReactNode,
) {
  const router = createMemoryRouter([
    {
      element: (
        <RequirePermission
          permission={permission}
          fallback={<p>no access</p>}
          loading={loading}
        />
      ),
      children: [{ path: '*', element: <p>secret</p> }],
    },
  ])

  render(<RouterProvider router={router} />)
}

afterEach(() => {
  vi.resetAllMocks()
})

test('shows a loading state until the permissions arrive', () => {
  usePermissions.mockReturnValue(permissions([], true))

  renderGuard(PERMISSIONS.readAnyFeedback)

  expect(screen.getByRole('status')).toHaveTextContent(i18n.t('common.loading'))
  expect(screen.queryByText('secret')).not.toBeInTheDocument()
})

test('shows the loading content the layout passes in', () => {
  usePermissions.mockReturnValue(permissions([], true))

  renderGuard(PERMISSIONS.readAnyFeedback, <p>custom wait</p>)

  expect(screen.getByText('custom wait')).toBeInTheDocument()
  expect(screen.queryByText('secret')).not.toBeInTheDocument()
})

test('renders the route for a viewer with the permission', () => {
  usePermissions.mockReturnValue(permissions([PERMISSIONS.readAnyFeedback]))

  renderGuard(PERMISSIONS.readAnyFeedback)

  expect(screen.getByText('secret')).toBeInTheDocument()
})

test('renders the fallback for a viewer without it', () => {
  usePermissions.mockReturnValue(permissions([PERMISSIONS.handleReports]))

  renderGuard(PERMISSIONS.readAnyFeedback)

  expect(screen.getByText('no access')).toBeInTheDocument()
  expect(screen.queryByText('secret')).not.toBeInTheDocument()
})

test('opens the route when the viewer holds any of several permissions', () => {
  usePermissions.mockReturnValue(permissions([PERMISSIONS.handleReports]))

  renderGuard([PERMISSIONS.readAnyFeedback, PERMISSIONS.handleReports])

  expect(screen.getByText('secret')).toBeInTheDocument()
})
