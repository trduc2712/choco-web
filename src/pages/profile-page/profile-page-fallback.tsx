import { useUser } from '@clerk/react'
import { useParams } from 'react-router'

import { ProfileLoading } from '@/features/profile'

import styles from './profile-page.module.scss'

export function ProfilePageFallback() {
  const { handle } = useParams()
  const { user } = useUser()

  return (
    <div className={styles.page}>
      <ProfileLoading
        canEdit={Boolean(user?.username && handle === `@${user.username}`)}
      />
    </div>
  )
}
