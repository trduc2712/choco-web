import { useState } from 'react'
import { useTranslation } from 'react-i18next'
// What stands in when there is no picture: the person's initials, or a plain
// silhouette.
export type AvatarFallback = 'initials' | 'person'
export type AvatarStatus = 'online' | 'busy' | 'offline'

export type AvatarProps = {
  name: string
  src?: string
  fallback?: AvatarFallback
  status?: AvatarStatus
  className?: string
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words.at(0)
  const last = words.length > 1 ? words.at(-1) : undefined

  return [first, last]
    .map((word) => (word ? [...word][0] : ''))
    .join('')
    .toUpperCase()
}

export function Avatar({
  name,
  src,
  fallback = 'initials',
  status,
  className,
}: AvatarProps) {
  const { t } = useTranslation()
  const [failedSrc, setFailedSrc] = useState<string>()
  const hasImage = src !== undefined && src !== failedSrc

  return (
    <span className={className}>
      {hasImage ? (
        <span>
          <img
            className="avatar-image"
            src={src}
            alt={name}
            onError={() => setFailedSrc(src)}
          />
        </span>
      ) : (
        <span role="img" aria-label={name}>
          {fallback === 'person' ? (
            <svg
              className="avatar-silhouette"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="9.5" r="4.2" />
              <path d="M3 24c0-5 4-8 9-8s9 3 9 8z" />
            </svg>
          ) : (
            <span aria-hidden="true">{getInitials(name)}</span>
          )}
        </span>
      )}
      {status && <span> {t(`avatar.status.${status}`)}</span>}
    </span>
  )
}
