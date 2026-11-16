import { ADMIN_USERS_PATH } from '@/constants/routes'

export function adminUserPath(userId: string) {
  return `${ADMIN_USERS_PATH}/${encodeURIComponent(userId)}`
}
