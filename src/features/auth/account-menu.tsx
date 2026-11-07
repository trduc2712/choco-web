import { useClerk, useUser } from '@clerk/react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import type { MenuActionItem, MenuProps } from '@/components/menu/menu'
import { Menu } from '@/components/menu/menu'
import { SIGN_IN_PATH } from '@/constants/routes'
import { useLanguageSubmenuItem } from '@/features/language'
import { useThemeSubmenuItem } from '@/features/theme'

type AccountMenuProps = Pick<
  MenuProps,
  'className' | 'placement' | 'trigger'
> & {
  accountItems?: MenuActionItem[]
}

export function AccountMenu({
  className,
  placement,
  trigger,
  accountItems,
}: AccountMenuProps) {
  const { t } = useTranslation()
  const { user } = useUser()
  const { redirectToUserProfile, signOut } = useClerk()
  const themeItem = useThemeSubmenuItem()
  const languageItem = useLanguageSubmenuItem()

  if (!user) {
    return null
  }

  const email = user.primaryEmailAddress?.emailAddress
  const name = user.fullName ?? user.username ?? email ?? ''
  const imageUrl = user.hasImage ? user.imageUrl : undefined

  return (
    <Menu
      label={t('auth.accountMenu.label')}
      align="end"
      className={className}
      placement={placement}
      trigger={
        trigger ?? (
          <Avatar name={name} src={imageUrl} size="sm" shape="square" />
        )
      }
      items={[
        themeItem,
        languageItem,
        ...(accountItems ?? [
          {
            id: 'manage-account',
            label: t('auth.accountMenu.manageAccount'),
            icon: 'settings',
            onSelect: () => void redirectToUserProfile(),
          },
        ]),
        {
          id: 'sign-out',
          label: t('auth.accountMenu.signOut'),
          icon: 'log-out',
          onSelect: () => void signOut({ redirectUrl: SIGN_IN_PATH }),
        },
      ]}
    />
  )
}
