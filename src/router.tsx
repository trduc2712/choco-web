import { createBrowserRouter } from 'react-router'

import {
  DESIGN_SYSTEM_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
} from '@/constants/routes'
import { RequireAuth } from '@/features/auth/require-auth'
import { AppLayout } from '@/layouts/app-layout'
import { RootLayout } from '@/layouts/root-layout'
import { HomePage } from '@/pages/home-page/home-page'
import { NotFoundPage } from '@/pages/not-found-page/not-found-page'
import { RouteErrorPage } from '@/pages/route-error-page/route-error-page'
import { SignInPage } from '@/pages/sign-in-page/sign-in-page'
import { SignUpPage } from '@/pages/sign-up-page/sign-up-page'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [{ index: true, element: <HomePage /> }],
          },
        ],
      },
      { path: `${SIGN_IN_PATH}/*`, element: <SignInPage /> },
      { path: `${SIGN_UP_PATH}/*`, element: <SignUpPage /> },
      ...(import.meta.env.DEV
        ? [
            {
              path: `${DESIGN_SYSTEM_PATH}/:entryId?`,
              lazy: async () => {
                const { DesignSystemPage } =
                  await import('@/pages/design-system-page/design-system-page')
                return { Component: DesignSystemPage }
              },
            },
          ]
        : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
