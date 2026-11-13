/** The avatar URL the API returned, as is; none when it sent none. */
export function getAvatarUrl(
  avatarUrl: string | null | undefined,
): string | undefined {
  return avatarUrl || undefined
}
