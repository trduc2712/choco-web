import { useUser } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import type { MenuActionItem } from '@/components/menu/menu'
import { SkipLink } from '@/components/skip-link/skip-link'
import { Text } from '@/components/text/text'
import {
  DESIGN_SYSTEM_PATH,
  HOME_PATH,
  userProfilePath,
} from '@/constants/routes'
import { AccountMenu } from '@/features/auth/account-menu'
import { UserSearchBox } from '@/features/user-search'

import styles from './app-layout.module.scss'

const MAIN_ID = 'main-content'

export function AppLayout() {
  const { t } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()
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
  ]

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
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Choco">
          <Link to={HOME_PATH} variant="standalone" className={styles.brand}>
            Choco
          </Link>
          {user ? (
            <AccountMenu
              placement="top-start"
              className={styles.accountMenu}
              trigger={
                <span className={styles.accountIdentity}>
                  <Avatar
                    name={name}
                    src={user.hasImage ? user.imageUrl : undefined}
                    shape="square"
                  />
                  <span className={styles.accountText}>
                    <Text as="span" size="sm" weight="semibold" isTruncated>
                      {name}
                    </Text>
                    {username ? (
                      <Text as="span" size="xs" tone="muted" isTruncated>
                        @{username}
                      </Text>
                    ) : null}
                  </span>
                  <Icon
                    name="chevron-up-down"
                    size="sm"
                    className={styles.accountChevron}
                  />
                </span>
              }
              accountItems={accountItems}
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
