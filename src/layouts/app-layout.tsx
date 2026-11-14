import { useUser } from '@clerk/react'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  matchPath,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router'

import { SkipLink } from '@/components/skip-link/skip-link'
import {
  HOME_PATH,
  POST_DETAIL_PATH,
  POST_DIALOG_PARAM,
  userProfilePath,
} from '@/constants/routes'
import { AccountDropdown } from '@/features/auth/account-dropdown'
import { SuspensionBanner, useMyAvatarUrl } from '@/features/current-user'
import { FeedTabs } from '@/features/feed'
import {
  NotificationsMenu,
  NotificationsRealtime,
} from '@/features/notifications'
import { ProfileSummaryCard } from '@/features/profile'
import { UserSearchBox } from '@/features/user-search'

import styles from './app-layout.module.scss'

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

// The left column is hidden for now; its track stays so the middle column and
// the header tabs keep their place.
const SHOW_PROFILE_COLUMN = false

export function AppLayout() {
  const { t } = useTranslation()
  const { user } = useUser()
  const { pathname } = useLocation()
  const username = user?.username
  const accountLabel = t('auth.accountMenu.label')
  const name = user?.fullName?.trim() || username || accountLabel
  const avatarUrl = useMyAvatarUrl()
  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <NotificationsRealtime />
      <SuspensionBanner />
      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerStart}>
              {user ? (
                <div className={styles.search}>
                  <UserSearchBox />
                </div>
              ) : null}
            </div>
            <div className={styles.headerCenter}>
              {user && pathname === HOME_PATH ? <FeedTabs /> : null}
            </div>
            {user ? (
              <div className={styles.headerEnd}>
                <NotificationsMenu />
                <div className={styles.account}>
                  <AccountDropdown />
                </div>
              </div>
            ) : null}
          </div>
        </header>
        <div className={styles.body}>
          {user && SHOW_PROFILE_COLUMN ? (
            <aside className={styles.left} aria-label={t('home.profile')}>
              <ProfileSummaryCard
                name={name}
                username={username ?? undefined}
                avatarUrl={avatarUrl}
                to={username ? userProfilePath(username) : undefined}
              />
            </aside>
          ) : null}
          <main id={MAIN_ID} className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
      {user ? <InPagePostDialog /> : null}
    </>
  )
}
