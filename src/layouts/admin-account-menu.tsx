import { useUser } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Icon } from '@/components/icon/icon'
import type { MenuActionItem } from '@/components/menu/menu'
import { UserCard } from '@/components/user-card/user-card'
import { HOME_PATH, userProfilePath } from '@/constants/routes'
import { AccountMenu } from '@/features/auth/account-menu'

import styles from './admin-account-menu.module.scss'

// The account menu at the foot of the admin sidebar. It is also the way back to
// the app. Collapsed, it shrinks to the avatar.
export function AdminAccountMenu({ isCollapsed }: { isCollapsed: boolean }) {
  const { t } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()

  if (!user) return null

  const username = user.username
  const accountLabel = t('auth.accountMenu.label')
  const name = user.fullName?.trim() || username || accountLabel
  const src = user.hasImage ? user.imageUrl : undefined
  const accountItems: MenuActionItem[] = [
    {
      id: 'back-to-app',
      label: t('admin.backToApp'),
      icon: 'arrow-left',
      onSelect: () => void navigate(HOME_PATH),
    },
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

  return (
    <AccountMenu
      placement="top-start"
      className={styles.menu}
      trigger={
        isCollapsed ? (
          <span className={styles.collapsed}>
            <Avatar name={name} src={src} size="sm" shape="square" />
          </span>
        ) : (
          <UserCard
            className={styles.identity}
            name={name}
            description={username ? `@${username}` : undefined}
            src={src}
            shape="square"
            isTruncated
            trailing={
              <Icon
                name="chevron-up-down"
                size="sm"
                className={styles.chevron}
              />
            }
          />
        )
      }
      accountItems={accountItems}
    />
  )
}
