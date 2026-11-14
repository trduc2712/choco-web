import { AdminPageHeader } from '@/features/admin'
import { NewRoleButton, RolesScreen } from '@/features/roles'
import { RoleHolders } from '@/features/users-admin'

export function AdminRolesPage() {
  return (
    <section>
      <AdminPageHeader screen="roles" actions={<NewRoleButton />} />
      <RolesScreen renderHolders={(role) => <RoleHolders roleId={role.id} />} />
    </section>
  )
}
