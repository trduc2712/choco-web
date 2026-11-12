import { useTranslation } from 'react-i18next'

import { AdminPageHeader } from '@/features/admin'
import { NewRoleButton, RolesScreen } from '@/features/roles'
import { RoleHolders } from '@/features/users-admin'

export function AdminRolesPage() {
  const { t } = useTranslation()

  return (
    <section>
      <AdminPageHeader
        screen="roles"
        summary={t('admin.roles.summary')}
        actions={<NewRoleButton />}
      />
      <RolesScreen renderHolders={(role) => <RoleHolders roleId={role.id} />} />
    </section>
  )
}
