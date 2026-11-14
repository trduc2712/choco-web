import { userProfilePath } from '@/constants/routes'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { adminUserPath } from '@/features/users-admin'

import type { FeedbackAuthor } from './feedback-admin-api'

// Where a click on a sender goes: an admin who may read users lands on the
// users screen with that user's drawer open, anyone else on the public profile.
export function useAuthorPath() {
  const { can } = usePermissions()
  const canViewUsers = can(PERMISSIONS.readAnyUser)
  return {
    canViewUsers,
    pathOf: (author: FeedbackAuthor) =>
      canViewUsers
        ? adminUserPath(author.id)
        : userProfilePath(author.username),
  }
}
