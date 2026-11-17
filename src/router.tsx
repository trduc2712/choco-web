import type { ComponentType, ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'

import {
  ADMIN_PATH,
  BLOCKED_USERS_PATH,
  DESIGN_SYSTEM_PATH,
  MESSAGES_ROUTE,
  MY_FEEDBACK_PATH,
  POST_COMPOSER_PATH,
  POST_DETAIL_PATH,
  RESET_PASSWORD_PATH,
  SIGN_IN_PATH,
  SIGN_IN_VERIFY_PATH,
  SIGN_UP_CONTINUE_PATH,
  SIGN_UP_PATH,
  SIGN_UP_VERIFY_PATH,
  SSO_CALLBACK_PATH,
} from '@/constants/routes'
import { ADMIN_PERMISSIONS, ADMIN_SCREENS } from '@/features/admin'
import { AuthCardSkeleton } from '@/features/auth'
import { GuestOnly } from '@/features/auth/guest-only'
import { RequireAuth } from '@/features/auth/require-auth'
import { RequirePermission } from '@/features/current-user'
import { isMessagingEnabled } from '@/features/messages'
import { AdminContentLoading, AdminLoading } from '@/layouts/admin-loading'
import { AppLayout } from '@/layouts/app-layout'
import { RootLayout } from '@/layouts/root-layout'
import { BlockedUsersPageFallback } from '@/pages/blocked-users-page/blocked-users-page-fallback'
import { HomeOrLandingPage } from '@/pages/home-page/home-or-landing-page'
import { HomePageFallback } from '@/pages/home-page/home-page-fallback'
import { MessagesPageFallback } from '@/pages/messages-page/messages-page-fallback'
import { MyFeedbackPageFallback } from '@/pages/my-feedback-page/my-feedback-page-fallback'
import { PageLoading } from '@/pages/page-loading/page-loading'
import { ProfilePageFallback } from '@/pages/profile-page/profile-page-fallback'
import { RouteErrorPage } from '@/pages/route-error-page/route-error-page'

function lazyPage<Props extends object = object>(
  load: () => Promise<ComponentType<Props>>,
  fallback: ReactNode = <PageLoading />,
) {
  const Page = lazy(async () => ({ default: await load() }))

  return function LazyRoutePage(props: Props) {
    return (
      <Suspense fallback={fallback}>
        <Page {...props} />
      </Suspense>
    )
  }
}

const AdminAuditLogPage = lazyPage(
  () =>
    import('@/pages/admin-audit-log-page/admin-audit-log-page').then(
      (module) => module.AdminAuditLogPage,
    ),
  <AdminContentLoading />,
)
const AdminFeedbackPage = lazyPage(
  () =>
    import('@/pages/admin-feedback-page/admin-feedback-page').then(
      (module) => module.AdminFeedbackPage,
    ),
  <AdminContentLoading />,
)
const AdminRolesPage = lazyPage(
  () =>
    import('@/pages/admin-roles-page/admin-roles-page').then(
      (module) => module.AdminRolesPage,
    ),
  <AdminContentLoading />,
)
const AdminUsersPage = lazyPage(
  () =>
    import('@/pages/admin-users-page/admin-users-page').then(
      (module) => module.AdminUsersPage,
    ),
  <AdminContentLoading />,
)

const AdminUserPage = lazyPage(
  () =>
    import('@/pages/admin-user-page/admin-user-page').then(
      (module) => module.AdminUserPage,
    ),
  <AdminContentLoading />,
)

const AdminReportsPage = lazyPage(
  () =>
    import('@/pages/admin-reports-page/admin-reports-page').then(
      (module) => module.AdminReportsPage,
    ),
  <AdminContentLoading />,
)
const AdminCommentsPage = lazyPage(
  () =>
    import('@/pages/admin-comments-page/admin-comments-page').then(
      (module) => module.AdminCommentsPage,
    ),
  <AdminContentLoading />,
)
const AdminPage = lazyPage(
  () =>
    import('@/pages/admin-page/admin-page').then((module) => module.AdminPage),
  <AdminContentLoading />,
)
const BlockedUsersPage = lazyPage(
  () =>
    import('@/pages/blocked-users-page/blocked-users-page').then(
      (module) => module.BlockedUsersPage,
    ),
  <BlockedUsersPageFallback />,
)
const MyFeedbackPage = lazyPage(
  () =>
    import('@/pages/my-feedback-page/my-feedback-page').then(
      (module) => module.MyFeedbackPage,
    ),
  <MyFeedbackPageFallback />,
)
const MessagesPage = lazyPage(
  () =>
    import('@/pages/messages-page/messages-page').then(
      (module) => module.MessagesPage,
    ),
  <MessagesPageFallback />,
)
const NotFoundPage = lazyPage(() =>
  import('@/pages/not-found-page/not-found-page').then(
    (module) => module.NotFoundPage,
  ),
)
const ResetPasswordPage = lazyPage(
  () =>
    import('@/pages/reset-password-page/reset-password-page').then(
      (module) => module.ResetPasswordPage,
    ),
  <AuthCardSkeleton fields={1} hasFooter />,
)
const SignInPage = lazyPage(
  () =>
    import('@/pages/sign-in-page/sign-in-page').then(
      (module) => module.SignInPage,
    ),
  <AuthCardSkeleton hasGoogle hasFooter />,
)
const SignInVerifyPage = lazyPage(
  () =>
    import('@/pages/sign-in-verify-page/sign-in-verify-page').then(
      (module) => module.SignInVerifyPage,
    ),
  <AuthCardSkeleton layout="verification" />,
)
const SignUpContinuePage = lazyPage(
  () =>
    import('@/pages/sign-up-continue-page/sign-up-continue-page').then(
      (module) => module.SignUpContinuePage,
    ),
  <AuthCardSkeleton fields={1} />,
)
const SignUpPage = lazyPage(
  () =>
    import('@/pages/sign-up-page/sign-up-page').then(
      (module) => module.SignUpPage,
    ),
  <AuthCardSkeleton fields={3} hasGoogle hasFooter />,
)
const SignUpVerifyPage = lazyPage(
  () =>
    import('@/pages/sign-up-verify-page/sign-up-verify-page').then(
      (module) => module.SignUpVerifyPage,
    ),
  <AuthCardSkeleton layout="verification" />,
)
const SsoCallbackPage = lazyPage(() =>
  import('@/pages/sso-callback-page/sso-callback-page').then(
    (module) => module.SsoCallbackPage,
  ),
)

const routes: RouteObject[] = [
  {
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
            path: '/:handle/:list',
            lazy: async () => {
              const [{ FollowListPage }, { followListLoader }] =
                await Promise.all([
                  import('@/pages/follow-list-page/follow-list-page'),
                  import('@/pages/follow-list-page/follow-list-loader'),
                ])
              return { Component: FollowListPage, loader: followListLoader }
            },
          },
          {
            // Home shows one skeleton from the session check to the first feed page.
            // A signed-out visitor gets the landing page instead.
            children: [{ index: true, element: <HomeOrLandingPage /> }],
          },
          // Each signed-in page waits for the session in its own shape.
          {
            element: <RequireAuth loading={<BlockedUsersPageFallback />} />,
            children: [
              { path: BLOCKED_USERS_PATH, element: <BlockedUsersPage /> },
            ],
          },
          {
            element: <RequireAuth loading={<MyFeedbackPageFallback />} />,
            children: [{ path: MY_FEEDBACK_PATH, element: <MyFeedbackPage /> }],
          },
          ...(isMessagingEnabled
            ? [
                {
                  element: <RequireAuth loading={<MessagesPageFallback />} />,
                  children: [
                    { path: MESSAGES_ROUTE, element: <MessagesPage /> },
                  ],
                },
              ]
            : []),
          {
            // The post opens over home, so it waits in home's shape.
            element: <RequireAuth loading={<HomePageFallback />} />,
            children: [
              {
                path: POST_DETAIL_PATH,
                HydrateFallback: HomePageFallback,
                lazy: async () => {
                  const { PostDetailPage } =
                    await import('@/pages/post-detail-page/post-detail-page')
                  return { Component: PostDetailPage }
                },
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth loading={<AdminLoading />} />,
        children: [
          {
            path: ADMIN_PATH,
            element: (
              <RequirePermission
                permission={ADMIN_PERMISSIONS}
                fallback={<NotFoundPage />}
                loading={<AdminLoading />}
              />
            ),
            children: [
              {
                lazy: async () => {
                  const { AdminLayout } = await import('@/layouts/admin-layout')
                  return { Component: AdminLayout }
                },
                children: [
                  // /admin has no page of its own and renders nothing.
                  { index: true },
                  ...ADMIN_SCREENS.map((screen) => ({
                    path: screen.to.slice(ADMIN_PATH.length + 1),
                    element: (
                      <RequirePermission
                        permission={screen.permission}
                        fallback={<NotFoundPage />}
                        loading={<AdminLoading />}
                      />
                    ),
                    children: [
                      {
                        index: true,
                        element:
                          screen.id === 'feedback' ? (
                            <AdminFeedbackPage />
                          ) : screen.id === 'users' ? (
                            <AdminUsersPage />
                          ) : screen.id === 'reports' ? (
                            <AdminReportsPage />
                          ) : screen.id === 'roles' ? (
                            <AdminRolesPage />
                          ) : screen.id === 'auditLog' ? (
                            <AdminAuditLogPage />
                          ) : screen.id === 'comments' ? (
                            <AdminCommentsPage />
                          ) : (
                            <AdminPage screen={screen.id} />
                          ),
                      },
                      ...(screen.id === 'users'
                        ? [{ path: ':userId', element: <AdminUserPage /> }]
                        : []),
                    ],
                  })),
                ],
              },
            ],
          },
        ],
      },
      // Each sign-in page waits for the session in its own card's shape.
      ...(
        [
          [
            SIGN_IN_PATH,
            <SignInPage />,
            <AuthCardSkeleton hasGoogle hasFooter />,
          ],
          [
            SIGN_IN_VERIFY_PATH,
            <SignInVerifyPage />,
            <AuthCardSkeleton layout="verification" />,
          ],
          [
            RESET_PASSWORD_PATH,
            <ResetPasswordPage />,
            <AuthCardSkeleton fields={1} hasFooter />,
          ],
          [
            SIGN_UP_PATH,
            <SignUpPage />,
            <AuthCardSkeleton fields={3} hasGoogle hasFooter />,
          ],
          [
            SIGN_UP_VERIFY_PATH,
            <SignUpVerifyPage />,
            <AuthCardSkeleton layout="verification" />,
          ],
          [
            SIGN_UP_CONTINUE_PATH,
            <SignUpContinuePage />,
            <AuthCardSkeleton fields={1} />,
          ],
        ] as const
      ).map(([path, page, loading]) => ({
        element: <GuestOnly loading={loading} />,
        children: [{ path, element: page }],
      })),
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
]

export const router = createBrowserRouter([
  { element: <RootLayout />, children: routes },
])
