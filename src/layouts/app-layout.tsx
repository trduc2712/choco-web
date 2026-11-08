import { useUser } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router'

import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import type { MenuActionItem } from '@/components/menu/menu'
import { SearchInput } from '@/components/search-input/search-input'
import { SkipLink } from '@/components/skip-link/skip-link'
import { Text } from '@/components/text/text'
import { DESIGN_SYSTEM_PATH, HOME_PATH } from '@/constants/routes'
import { AccountAvatar } from '@/features/account-avatar'
import { AccountMenu } from '@/features/auth/account-menu'
import { useCurrentUser } from '@/features/current-user'

import styles from './app-layout.module.scss'

const MAIN_ID = 'main-content'

export function AppLayout() {
  const { t } = useTranslation()
  const { user } = useUser()
  const currentUser = useCurrentUser()
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
        if (username) void navigate(`/@${encodeURIComponent(username)}`)
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
                  <AccountAvatar
                    accountId={currentUser.data?.id}
                    isAccountIdLoading={currentUser.isLoading}
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
        <main id={MAIN_ID} className={styles.main}>
          <Outlet />
        </main>
        <aside className={styles.search} aria-label={t('home.search')}>
          <SearchInput
            label={t('home.search')}
            placeholder={t('home.search')}
            isLabelHidden
          />
        </aside>
      </div>
    </>
  )
}
