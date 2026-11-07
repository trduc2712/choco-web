import { ProfileHeader } from './profile-header'

export function ProfileLoading({ canEdit }: { canEdit?: boolean }) {
  return <ProfileHeader canEdit={canEdit} />
}
