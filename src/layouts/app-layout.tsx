import { useUser } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'

import { SkipLink } from '@/components/skip-link/skip-link'
import { HOME_PATH, userProfilePath } from '@/constants/routes'
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
                <AccountDropdown />
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
    </>
  )
}
