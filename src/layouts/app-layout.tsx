import { useAuth, useUser } from '@clerk/react'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  matchPath,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router'

import { SkipLink } from '@/components/skip-link/skip-link'
import {
  HOME_PATH,
  POST_COMMENT_PARAM,
  POST_DETAIL_PATH,
  POST_DIALOG_PARAM,
} from '@/constants/routes'
import { AccountDropdown } from '@/features/auth/account-dropdown'
import { SuspensionBanner } from '@/features/current-user'
import { FeedTabs } from '@/features/feed'
import {
  isMessagingEnabled,
  MessagesMenu,
  MessagesRealtime,
  MessagingProvider,
} from '@/features/messages'
import {
  NotificationsMenu,
  NotificationsRealtime,
} from '@/features/notifications'
import { UserSearchBox } from '@/features/user-search'

const MAIN_ID = 'main-content'
const PostDetailDialog = lazy(() =>
  import('@/features/post-detail').then(({ PostDetailDialog }) => ({
    default: PostDetailDialog,
  })),
)

function InPagePostDialog() {
  const { state, pathname } = useLocation()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const postId = params.get(POST_DIALOG_PARAM)

  if (!postId || matchPath(POST_DETAIL_PATH, pathname)) return null

  function close() {
    if (state?.openedPostDialog === true) {
      void navigate(-1)
    } else {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.delete(POST_DIALOG_PARAM)
          next.delete(POST_COMMENT_PARAM)
          return next
        },
        { replace: true, preventScrollReset: true },
      )
    }
  }

  return (
    <Suspense fallback={null}>
      <PostDetailDialog key={postId} postId={postId} onClose={close} />
    </Suspense>
  )
}

export function AppLayout() {
  const { t } = useTranslation()
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { pathname } = useLocation()
  const isHome = pathname === HOME_PATH

  // A signed-out visitor at home gets the landing page on its own, with no app
  // header around it.
  if (isHome && isLoaded && !isSignedIn) return <Outlet />

  return (
    <MessagingProvider>
      <SkipLink targetId={MAIN_ID} />
      <NotificationsRealtime />
      {isMessagingEnabled ? <MessagesRealtime /> : null}
      <SuspensionBanner />
      <header>
        <NavLink to={HOME_PATH} end>
          {t('layout.home')}
        </NavLink>
        {user && <UserSearchBox />}
        {(user || !isLoaded) && isHome && <FeedTabs />}
        {user && (
          <>
            {isMessagingEnabled && <MessagesMenu />}
            <NotificationsMenu />
            <AccountDropdown />
          </>
        )}
      </header>
      <main id={MAIN_ID}>
        <Outlet />
      </main>
      {user ? <InPagePostDialog /> : null}
    </MessagingProvider>
  )
}
