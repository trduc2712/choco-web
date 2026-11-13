import { useUser } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import type { MenuActionItem } from '@/components/menu/menu'
import { SkipLink } from '@/components/skip-link/skip-link'
import {
  ADMIN_PATH,
  BLOCKED_USERS_PATH,
  DESIGN_SYSTEM_PATH,
  HOME_PATH,
  userProfilePath,
} from '@/constants/routes'
import { ADMIN_PERMISSIONS } from '@/features/admin'
import { AccountMenu } from '@/features/auth/account-menu'
import {
  SuspensionBanner,
  usePermissions,
  useSuspension,
} from '@/features/current-user'
import { FeedTabs } from '@/features/feed'
import { FeedbackDialog } from '@/features/feedback'
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
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { canAny } = usePermissions()
  const { isSuspended } = useSuspension()
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const username = user?.username
  const accountLabel = t('auth.accountMenu.label')
  const name = user?.fullName?.trim() || username || accountLabel
  const avatarUrl = user?.hasImage ? user.imageUrl : undefined
  const accountItems: MenuActionItem[] = [
    {
      id: 'profile',
      label: t('home.profile'),
      icon: 'user-circle',
      isDisabled: !username,
      onSelect: () => {
        if (username) void navigate(userProfilePath(username))
      },
    },
    {
      id: 'blocked-users',
      label: t('blocks.title'),
      icon: 'user-x',
      onSelect: () => void navigate(BLOCKED_USERS_PATH),
    },
    {
      id: 'send-feedback',
      label: t('feedback.menuItem'),
      isDisabled: isSuspended,
      icon: 'message',
      onSelect: () => setIsFeedbackOpen(true),
    },
  ]

  if (canAny(ADMIN_PERMISSIONS)) {
    accountItems.splice(accountItems.length - 1, 0, {
      id: 'admin',
      label: t('admin.menuItem'),
      icon: 'shield',
      onSelect: () => void navigate(ADMIN_PATH),
    })
  }

  if (import.meta.env.DEV) {
    accountItems.push({
      id: 'ares-design-system',
      label: t('auth.accountMenu.designSystem'),
      icon: 'book-open',
      onSelect: () => void navigate(DESIGN_SYSTEM_PATH),
    })
  }

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
                <AccountMenu
                  placement="bottom-end"
                  className={styles.accountTrigger}
                  trigger={<Avatar name={name} src={avatarUrl} size="md" />}
                  accountItems={accountItems}
                />
                <FeedbackDialog
                  isOpen={isFeedbackOpen}
                  onClose={() => setIsFeedbackOpen(false)}
                />
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
