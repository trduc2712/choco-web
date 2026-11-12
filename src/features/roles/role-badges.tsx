import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'

import type { Role } from './roles-api'

// What kind of role it is: the one everybody has, one the system keeps, or
// neither (no badge).
export function RoleBadges({ role }: { role: Role }) {
  const { t } = useTranslation()

  return (
    <>
      {role.isDefault ? (
        <Badge tone="primary" icon="users">
          {t('admin.roles.badges.default')}
        </Badge>
      ) : null}
      {role.systemKey ? (
        <Badge tone="neutral" icon="lock">
          {t('admin.roles.badges.system')}
        </Badge>
      ) : null}
    </>
  )
}
