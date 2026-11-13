import { useUser } from '@clerk/react'
import { useParams } from 'react-router'

import { ProfileLoading } from '@/features/profile'

export function ProfilePageFallback() {
  const { handle } = useParams()
  const { user } = useUser()

  return (
    <div data-profile-page="">
      <ProfileLoading
        canEdit={Boolean(user?.username && handle === `@${user.username}`)}
      />
    </div>
  )
}
