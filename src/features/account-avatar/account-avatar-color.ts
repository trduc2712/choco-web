import type { AvatarFallbackColor } from '@/components/avatar/avatar'

// Keep the palette order and hash stable so existing accounts retain their colors.
const ACCOUNT_COLORS = [
  'green',
  'teal',
  'blue',
  'indigo',
  'purple',
  'pink',
  'orange',
  'amber',
] as const satisfies readonly AvatarFallbackColor[]

export function getAccountAvatarColor(accountId?: string) {
  if (!accountId) return undefined

  const id = accountId.toLowerCase()
  let hash = 0x811c9dc5
  for (let index = 0; index < id.length; index++) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 0x01000193)
  }
  return ACCOUNT_COLORS[(hash >>> 0) % ACCOUNT_COLORS.length]
}
