import { createBrowserRouter } from 'react-router'

import {
  DESIGN_SYSTEM_PATH,
  RESET_PASSWORD_PATH,
  SIGN_IN_PATH,
  SIGN_IN_VERIFY_PATH,
  SIGN_UP_CONTINUE_PATH,
  SIGN_UP_PATH,
  SIGN_UP_VERIFY_PATH,
  SSO_CALLBACK_PATH,
} from '@/constants/routes'
import { GuestOnly } from '@/features/auth/guest-only'
import { RequireAuth } from '@/features/auth/require-auth'
import { AppLayout } from '@/layouts/app-layout'
import { RootLayout } from '@/layouts/root-layout'
import { HomePage } from '@/pages/home-page/home-page'
import { NotFoundPage } from '@/pages/not-found-page/not-found-page'
import { ResetPasswordPage } from '@/pages/reset-password-page/reset-password-page'
import { RouteErrorPage } from '@/pages/route-error-page/route-error-page'
import { SignInPage } from '@/pages/sign-in-page/sign-in-page'
import { SignInVerifyPage } from '@/pages/sign-in-verify-page/sign-in-verify-page'
import { SignUpContinuePage } from '@/pages/sign-up-continue-page/sign-up-continue-page'
import { SignUpPage } from '@/pages/sign-up-page/sign-up-page'
import { SignUpVerifyPage } from '@/pages/sign-up-verify-page/sign-up-verify-page'
import { SsoCallbackPage } from '@/pages/sso-callback-page/sso-callback-page'

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
      {
        element: <GuestOnly />,
        children: [
          { path: SIGN_IN_PATH, element: <SignInPage /> },
          { path: SIGN_IN_VERIFY_PATH, element: <SignInVerifyPage /> },
          { path: RESET_PASSWORD_PATH, element: <ResetPasswordPage /> },
          { path: SIGN_UP_PATH, element: <SignUpPage /> },
          { path: SIGN_UP_VERIFY_PATH, element: <SignUpVerifyPage /> },
          { path: SIGN_UP_CONTINUE_PATH, element: <SignUpContinuePage /> },
        ],
      },
      { path: SSO_CALLBACK_PATH, element: <SsoCallbackPage /> },
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
