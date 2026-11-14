import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { Header } from '@/components/header/header'
import { SkipLink } from '@/components/skip-link/skip-link'
import type { TabNavItem } from '@/components/tab-nav/tab-nav'
import { TabNav } from '@/components/tab-nav/tab-nav'
import { ADMIN_SCREENS, useAdminCounts } from '@/features/admin'
import { AccountDropdown } from '@/features/auth/account-dropdown'
import { SuspensionBanner, usePermissions } from '@/features/current-user'
import { NotificationsBell } from '@/features/notifications'

import styles from './admin-layout.module.scss'

const MAIN_ID = 'main-content'

// A badge only for a count above zero. Zero, null (no permission) and no answer
// all show nothing.
function badgeCount(count: number | null | undefined) {
  return count !== null && count !== undefined && count > 0 ? count : undefined
}

// Admin shell: a top bar with a tab per screen and the same account dropdown as
// the rest of the app, and the screen below at full width. On a narrow screen
// the tabs scroll sideways.
export function AdminLayout() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const counts = useAdminCounts().data

  const items: TabNavItem[] = ADMIN_SCREENS.filter((screen) =>
    can(screen.permission),
  ).map((screen) => ({
    id: screen.id,
    label: t(`admin.screens.${screen.id}`),
    to: screen.to,
    count: badgeCount(screen.countKey && counts?.[screen.countKey]),
  }))

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SuspensionBanner />
      <div className={styles.layout}>
        <Header className={styles.header}>
          <TabNav
            className={styles.tabs}
            label={t('admin.nav.label')}
            items={items}
            badgeShape="square"
          />
          <div className={styles.actions}>
            {/* The same bell as the app's header. Admin notifications have no
              source yet, so it opens nothing for now. */}
            <NotificationsBell aria-label={t('admin.notifications.title')} />
            <div className={styles.account}>
              <AccountDropdown />
            </div>
          </div>
        </Header>
        <main id={MAIN_ID} className={styles.main}>
          <Outlet />
        </main>
      </div>
    </>
  )
}
