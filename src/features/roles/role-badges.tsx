import { useTranslation } from 'react-i18next'

import type { Role } from './roles-api'

// What kind of role it is: the one everybody has, one the system keeps, or
// neither (no badge).
export function RoleBadges({ role }: { role: Role }) {
  const { t } = useTranslation()

  return (
    <>
      {role.isDefault ? <span>{t('admin.roles.badges.default')}</span> : null}
      {role.systemKey ? <span>{t('admin.roles.badges.system')}</span> : null}
    </>
  )
}
