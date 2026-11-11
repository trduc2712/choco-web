export const HOME_PATH = '/'
export const USER_SEARCH_PATH = '/search'
export const NOTIFICATIONS_PATH = '/notifications'
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

export function userProfilePath(username: string) {
  return `/@${encodeURIComponent(username)}`
}

export const POST_DETAIL_PATH = '/:handle/posts/:postId'

export function userPostPath(username: string, postId: string) {
  return `${userProfilePath(username)}/posts/${encodeURIComponent(postId)}`
}

export function userFollowersPath(username: string) {
  return `${userProfilePath(username)}/followers`
}

export function userFollowingPath(username: string) {
  return `${userProfilePath(username)}/following`
}
