import { useParams } from 'react-router'

import { UserDetails } from '@/features/users-admin'

// /admin/users/:userId: one account, on a page of its own.
export function AdminUserPage() {
  const { userId = '' } = useParams()

  return (
    <section>
      {/* A new account starts fresh, without the last one's state. */}
      <UserDetails key={userId} userId={userId} />
    </section>
  )
}
