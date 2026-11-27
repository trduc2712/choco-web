import { Skeleton } from '@/components/skeleton/skeleton'
import { FEED_SKELETON_COUNT, PostCardSkeletons } from '@/features/posts'

import { ProfileHeader } from './profile-header'

export function ProfileLoading({ canEdit }: { canEdit?: boolean }) {
  return (
    <ProfileHeader canEdit={canEdit}>
      <div>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} width="var(--space-7)" />
        ))}
      </div>
      <div>
        <PostCardSkeletons count={FEED_SKELETON_COUNT} />
      </div>
    </ProfileHeader>
  )
}
