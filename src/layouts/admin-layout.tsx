import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { Button } from '@/components/button/button'
import { Header } from '@/components/header/header'
import type { NavListSection } from '@/components/nav-list/nav-list'
import { NavList } from '@/components/nav-list/nav-list'
import { Sidebar } from '@/components/sidebar/sidebar'
import { SkipLink } from '@/components/skip-link/skip-link'
import { ADMIN_SCREENS, useAdminCounts } from '@/features/admin'
import { AccountDropdown } from '@/features/auth/account-dropdown'
import {
  PERMISSIONS,
  SuspensionBanner,
  usePermissions,
} from '@/features/current-user'
import { NotificationsBell } from '@/features/notifications'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cx } from '@/lib/cx'

import styles from './admin-layout.module.scss'

const MAIN_ID = 'main-content'

// A badge only for a count above zero. Zero, null (no permission) and no answer
// all show nothing.
function badgeCount(count: number | null | undefined) {
  return count !== null && count !== undefined && count > 0 ? count : undefined
}

// Admin shell: a top bar with the same bell and account dropdown as the rest of
// the app, a sidebar with a link per screen grouped by kind, and the screen
// beside it. On a narrow screen the sidebar starts collapsed to its icons.
export function AdminLayout() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const isNarrow = useMediaQuery('(width < 768px)')
  // Starts as icons only on a narrow screen; the header button toggles it.
  const [isCollapsed, setIsCollapsed] = useState(isNarrow)
  const counts = useAdminCounts(
    can(PERMISSIONS.readAnyFeedback) || can(PERMISSIONS.handleReports),
  ).data

  const sections: NavListSection[] = []
  for (const screen of ADMIN_SCREENS) {
    if (!can(screen.permission)) continue
    let section = sections.find(({ id }) => id === screen.group)
    if (!section) {
      section = {
        id: screen.group,
        title: t(`admin.groups.${screen.group}`),
        items: [],
      }
      sections.push(section)
    }
    section.items.push({
      id: screen.id,
      label: t(`admin.screens.${screen.id}`),
      to: screen.to,
      icon: screen.icon,
      count: badgeCount(screen.countKey && counts?.[screen.countKey]),
      // Admins see the real number of items waiting, not "99+".
      countMax: Number.MAX_SAFE_INTEGER,
    })
  }

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SuspensionBanner />
      <div className={styles.layout}>
        <Sidebar
          className={cx(styles.sidebar, isCollapsed && styles.collapsed)}
          label={t('admin.nav.label')}
        >
          {() => (
            <NavList
              label={t('admin.nav.label')}
              sections={sections}
              isCollapsed={isCollapsed}
              badgeShape="square"
            />
          )}
        </Sidebar>
        <div className={styles.content}>
          <Header className={styles.header}>
            <Button
              className={styles.toggle}
              icon={isCollapsed ? 'panel-right' : 'panel-left'}
              variant="ghost"
              size="sm"
              aria-label={t(
                isCollapsed ? 'sidebar.expand' : 'sidebar.collapse',
              )}
              aria-expanded={!isCollapsed}
              onClick={() => setIsCollapsed(!isCollapsed)}
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
      </div>
    </>
  )
}
