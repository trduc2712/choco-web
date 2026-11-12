import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'

import { Button } from '@/components/button/button'
import { Drawer } from '@/components/drawer/drawer'
import { Header } from '@/components/header/header'
import { Link } from '@/components/link/link'
import type { NavListSection } from '@/components/nav-list/nav-list'
import { NavList } from '@/components/nav-list/nav-list'
import { Sidebar } from '@/components/sidebar/sidebar'
import { SkipLink } from '@/components/skip-link/skip-link'
import { Text } from '@/components/text/text'
import { ADMIN_PATH } from '@/constants/routes'
import type { AdminGroupId } from '@/features/admin'
import {
  ADMIN_SCREENS,
  AdminBackButton,
  AdminBreadcrumb,
  AdminEnvironmentBadge,
  AdminNotifications,
  AdminSearch,
  useAdminCounts,
} from '@/features/admin'
import { SuspensionBanner, usePermissions } from '@/features/current-user'
import { useStoredBoolean } from '@/hooks/use-stored-boolean'

import { AdminAccountMenu } from './admin-account-menu'
import styles from './admin-layout.module.scss'

const MAIN_ID = 'main-content'
const COLLAPSED_KEY = 'admin-sidebar-collapsed'
const GROUPS: readonly AdminGroupId[] = ['moderation', 'system']

// A badge only for a count above zero. Zero, null (no permission) and no answer
// all show nothing.
function badgeCount(count: number | null | undefined) {
  return count !== null && count !== undefined && count > 0 ? count : undefined
}

// Admin shell: a collapsible sidebar, a top bar with the admin bell, and the
// screen in the middle. Below lg the sidebar becomes a drawer.
export function AdminLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { can } = usePermissions()
  const counts = useAdminCounts().data
  const [isCollapsed, setIsCollapsed] = useStoredBoolean(COLLAPSED_KEY, false)
  // The drawer is open only on the page it was opened on, so picking a screen
  // closes it without an effect.
  const [drawerPath, setDrawerPath] = useState<string | null>(null)

  const sections: NavListSection[] = GROUPS.map((group) => ({
    id: group,
    title: t(`admin.groups.${group}`),
    items: ADMIN_SCREENS.filter(
      (screen) => screen.group === group && can(screen.permission),
    ).map((screen) => ({
      id: screen.id,
      label: t(`admin.screens.${screen.id}`),
      to: screen.to,
      icon: screen.icon,
      count: badgeCount(screen.countKey && counts?.[screen.countKey]),
    })),
  })).filter((section) => section.items.length > 0)

  const nav = (collapsed: boolean) => (
    <NavList
      label={t('admin.nav.label')}
      sections={sections}
      isCollapsed={collapsed}
    />
  )

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SuspensionBanner />
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <Sidebar
            label={t('admin.label')}
            isCollapsible
            isCollapsed={isCollapsed}
            onCollapsedChange={setIsCollapsed}
            header={
              <div className={styles.brandRow}>
                <Link
                  to={ADMIN_PATH}
                  variant="standalone"
                  className={styles.brand}
                >
                  <Text as="span" weight="semibold" isTruncated>
                    {t('admin.title')}
                  </Text>
                </Link>
                <AdminEnvironmentBadge />
              </div>
            }
            footer={<AdminAccountMenu isCollapsed={isCollapsed} />}
          >
            {({ isCollapsed: collapsed }) => nav(collapsed)}
          </Sidebar>
        </div>
        <div className={styles.column}>
          <Header>
            <Button
              className={styles.menuButton}
              variant="ghost"
              icon="menu"
              aria-label={t('admin.openMenu')}
              onClick={() => setDrawerPath(pathname)}
            />
            <AdminBackButton />
            <AdminBreadcrumb className={styles.breadcrumb} />
            <AdminSearch />
            <AdminNotifications />
          </Header>
          <main id={MAIN_ID} className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
      <Drawer
        isOpen={drawerPath === pathname}
        onClose={() => setDrawerPath(null)}
        side="start"
        size="sm"
        title={t('admin.title')}
      >
        {nav(false)}
      </Drawer>
    </>
  )
}
