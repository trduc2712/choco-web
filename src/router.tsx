import type { ComponentType } from 'react'
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'

import { Spinner } from '@/components/spinner/spinner'
import {
  DESIGN_SYSTEM_PATH,
  POST_COMPOSER_PATH,
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
import { ProfilePageFallback } from '@/pages/profile-page/profile-page-fallback'
import { RouteErrorPage } from '@/pages/route-error-page/route-error-page'

import styles from './router.module.scss'

function lazyPage(load: () => Promise<ComponentType>) {
  const Page = lazy(async () => ({ default: await load() }))

  return function LazyRoutePage() {
    return (
      <Suspense
        fallback={
          <div className={styles.loading}>
            <Spinner size="lg" />
          </div>
        }
      >
        <Page />
      </Suspense>
    )
  }
}

const HomePage = lazyPage(() =>
  import('@/pages/home-page/home-page').then((module) => module.HomePage),
)
const NotFoundPage = lazyPage(() =>
  import('@/pages/not-found-page/not-found-page').then(
    (module) => module.NotFoundPage,
  ),
)
const ResetPasswordPage = lazyPage(() =>
  import('@/pages/reset-password-page/reset-password-page').then(
    (module) => module.ResetPasswordPage,
  ),
)
const SignInPage = lazyPage(() =>
  import('@/pages/sign-in-page/sign-in-page').then(
    (module) => module.SignInPage,
  ),
)
const SignInVerifyPage = lazyPage(() =>
  import('@/pages/sign-in-verify-page/sign-in-verify-page').then(
    (module) => module.SignInVerifyPage,
  ),
)
const SignUpContinuePage = lazyPage(() =>
  import('@/pages/sign-up-continue-page/sign-up-continue-page').then(
    (module) => module.SignUpContinuePage,
  ),
)
const SignUpPage = lazyPage(() =>
  import('@/pages/sign-up-page/sign-up-page').then(
    (module) => module.SignUpPage,
  ),
)
const SignUpVerifyPage = lazyPage(() =>
  import('@/pages/sign-up-verify-page/sign-up-verify-page').then(
    (module) => module.SignUpVerifyPage,
  ),
)
const SsoCallbackPage = lazyPage(() =>
  import('@/pages/sso-callback-page/sso-callback-page').then(
    (module) => module.SsoCallbackPage,
  ),
)

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/:handle',
            HydrateFallback: ProfilePageFallback,
            lazy: async () => {
              const [{ ProfilePage }, { profileLoader }] = await Promise.all([
                import('@/pages/profile-page/profile-page'),
                import('@/pages/profile-page/profile-loader'),
              ])
              return { Component: ProfilePage, loader: profileLoader }
            },
          },
          {
            element: <RequireAuth />,
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
              path: POST_COMPOSER_PATH,
              lazy: async () => {
                const { PostComposerPage } =
                  await import('@/pages/post-composer-page/post-composer-page')
                return { Component: PostComposerPage }
              },
            },
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
