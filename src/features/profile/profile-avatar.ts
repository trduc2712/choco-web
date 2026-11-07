/** Keep uploaded/OAuth photos, but use Ares initials for Clerk-generated avatars. */
export function getProfileAvatarUrl(
  avatarUrl: string | null | undefined,
): string | undefined {
  if (!avatarUrl) return undefined

  try {
    const url = new URL(avatarUrl)
    if (!['img.clerk.com', 'images.clerk.dev'].includes(url.hostname)) {
      return avatarUrl
    }

    if (url.pathname === '/default-user.png') return undefined

    const encoded = url.pathname
      .slice(1)
      .split('/')[0]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const payload: unknown = JSON.parse(atob(encoded))
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'type' in payload &&
      payload.type === 'default'
    ) {
      return undefined
    }
  } catch {
    // Unknown or relative URLs retain the Avatar component's normal image fallback.
  }

  return avatarUrl
}
