import { ADMIN_USERS_PATH } from '@/constants/routes'

// Where an admin reads about this user: the users screen with their drawer
// open.
export function adminUserPath(userId: string) {
  return `${ADMIN_USERS_PATH}?${new URLSearchParams({ user: userId })}`
}
