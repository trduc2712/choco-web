import { useUser } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router'

import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import type { MenuActionItem } from '@/components/menu/menu'
import { SkipLink } from '@/components/skip-link/skip-link'
import { UserCard } from '@/components/user-card/user-card'
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
import { FeedbackDialog } from '@/features/feedback'
import {
  NotificationsLink,
  NotificationsRealtime,
} from '@/features/notifications'
import { UserSearchBox } from '@/features/user-search'

import styles from './app-layout.module.scss'

const MAIN_ID = 'main-content'

export function AppLayout() {
  const { t } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()
  const { canAny } = usePermissions()
  const { isSuspended } = useSuspension()
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const username = user?.username
  const accountLabel = t('auth.accountMenu.label')
  const name = user?.fullName?.trim() || username || accountLabel
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
        <aside className={styles.sidebar} aria-label="Choco">
          <Link to={HOME_PATH} variant="standalone" className={styles.brand}>
            Choco
          </Link>
          {user ? (
            <nav aria-label={t('layout.primaryNav')} className={styles.nav}>
              <ul role="list" className={styles.navList}>
                <li>
                  <NotificationsLink />
                </li>
              </ul>
            </nav>
          ) : null}
          {user ? (
            <AccountMenu
              placement="top-start"
              className={styles.accountMenu}
              trigger={
                <UserCard
                  className={styles.accountIdentity}
                  name={name}
                  description={username ? `@${username}` : undefined}
                  src={user.hasImage ? user.imageUrl : undefined}
                  shape="square"
                  isTruncated
                  trailing={
                    <Icon
                      name="chevron-up-down"
                      size="sm"
                      className={styles.accountChevron}
                    />
                  }
                />
              }
              accountItems={accountItems}
            />
          ) : null}
          {user ? (
            <FeedbackDialog
              isOpen={isFeedbackOpen}
              onClose={() => setIsFeedbackOpen(false)}
            />
          ) : null}
        </aside>
        {user ? (
          <div className={styles.search}>
            <UserSearchBox />
          </div>
        ) : null}
        <main id={MAIN_ID} className={styles.main}>
          <Outlet />
        </main>
      </div>
    </>
  )
}
