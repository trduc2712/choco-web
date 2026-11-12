import { useTranslation } from 'react-i18next'

import { AdminPageHeader } from '@/features/admin'
import { UsersList } from '@/features/users-admin'

export function AdminUsersPage() {
  const { t } = useTranslation()

  return (
    <section>
      <AdminPageHeader screen="users" summary={t('admin.users.summary')} />
      <UsersList />
    </section>
  )
}
