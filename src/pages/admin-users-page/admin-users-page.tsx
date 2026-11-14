import { AdminPageHeader } from '@/features/admin'
import { UsersList } from '@/features/users-admin'

export function AdminUsersPage() {
  return (
    <section>
      <AdminPageHeader screen="users" />
      <UsersList />
    </section>
  )
}
