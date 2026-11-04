import {
  HOME_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  SSO_CALLBACK_PATH,
} from '@/constants/routes'

export const REDIRECT_PARAM = 'redirect_url'

const AUTH_PATHS = [SIGN_IN_PATH, SIGN_UP_PATH, SSO_CALLBACK_PATH]

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export function getSafeRedirectPath(value: string | null | undefined): string {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return HOME_PATH
  }

  try {
    const url = new URL(value, window.location.origin)

    if (url.origin !== window.location.origin || isAuthPath(url.pathname)) {
      return HOME_PATH
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return HOME_PATH
  }
}

export function withRedirect(path: string, redirectPath: string): string {
  if (redirectPath === HOME_PATH) {
    return path
  }

  return `${path}?${new URLSearchParams({ [REDIRECT_PARAM]: redirectPath })}`
}
