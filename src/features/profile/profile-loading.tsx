import { PostCardSkeletons } from '@/features/posts'

import { ProfileHeader } from './profile-header'

export function ProfileLoading({ canEdit }: { canEdit?: boolean }) {
  return (
    <ProfileHeader canEdit={canEdit}>
      <div>
        {[0, 1, 2].map((index) => (
          <span aria-hidden="true" key={index}>
            &hellip;
          </span>
        ))}
      </div>
      <div>
        <PostCardSkeletons />
      </div>
    </ProfileHeader>
  )
}
