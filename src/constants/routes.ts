export const HOME_PATH = '/'
export const SIGN_IN_PATH = '/sign-in'
export const SIGN_IN_VERIFY_PATH = '/sign-in/verify'
export const RESET_PASSWORD_PATH = '/sign-in/reset-password'
export const SIGN_UP_PATH = '/sign-up'
export const SIGN_UP_VERIFY_PATH = '/sign-up/verify'
export const SIGN_UP_CONTINUE_PATH = '/sign-up/continue'
export const SSO_CALLBACK_PATH = '/sso-callback'
export const DESIGN_SYSTEM_PATH = '/design-system'
export const POST_COMPOSER_PATH = '/post-composer'
export const BLOCKED_USERS_PATH = '/settings/blocked-users'
export const ADMIN_PATH = '/admin'
export const ADMIN_FEEDBACK_PATH = `${ADMIN_PATH}/feedback`
export const ADMIN_REPORTS_PATH = `${ADMIN_PATH}/reports`
export const ADMIN_USERS_PATH = `${ADMIN_PATH}/users`
export const ADMIN_POSTS_PATH = `${ADMIN_PATH}/posts`
export const ADMIN_COMMENTS_PATH = `${ADMIN_PATH}/comments`
export const ADMIN_ROLES_PATH = `${ADMIN_PATH}/roles`
export const ADMIN_AUDIT_LOG_PATH = `${ADMIN_PATH}/audit-log`

export function userProfilePath(username: string) {
  return `/@${encodeURIComponent(username)}`
}

export const POST_DETAIL_PATH = '/:handle/posts/:postId'
export const POST_DIALOG_PARAM = 'post'

export function userPostPath(username: string, postId: string) {
  return `${userProfilePath(username)}/posts/${encodeURIComponent(postId)}`
}

export function userFollowersPath(username: string) {
  return `${userProfilePath(username)}/followers`
}

export function userFollowingPath(username: string) {
  return `${userProfilePath(username)}/following`
}
