import { Skeleton } from '@/components/skeleton/skeleton'

import { ProfileHeader } from './profile-header'
import { ProfilePostSkeletons } from './profile-posts'
import styles from './profile-posts.module.scss'

export function ProfileLoading({ canEdit }: { canEdit?: boolean }) {
  return (
    <ProfileHeader canEdit={canEdit}>
      {() => (
        <>
          <div className={styles.tabSkeletons}>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} width="var(--space-7)" />
            ))}
          </div>
          <ProfilePostSkeletons />
        </>
      )}
    </ProfileHeader>
  )
}
