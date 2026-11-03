import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import styles from './avatar.module.scss'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarShape = 'circle' | 'square'
export type AvatarStatus = 'online' | 'busy' | 'offline'

export type AvatarProps = {
  name: string
  src?: string
  size?: AvatarSize
  shape?: AvatarShape
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
  size = 'md',
  shape = 'circle',
  status,
  className,
}: AvatarProps) {
  const { t } = useTranslation()
  const [failedSrc, setFailedSrc] = useState<string>()
  const hasImage = src !== undefined && src !== failedSrc

  return (
    <span className={cx(styles.root, styles[size], styles[shape], className)}>
      {hasImage ? (
        <span className={styles.frame}>
          <img
            className={styles.image}
            src={src}
            alt={name}
            onError={() => setFailedSrc(src)}
          />
        </span>
      ) : (
        <span className={styles.frame} role="img" aria-label={name}>
          <span aria-hidden="true">{getInitials(name)}</span>
        </span>
      )}
      {status && (
        <>
          <span
            className={cx(styles.status, styles[status])}
            aria-hidden="true"
          />
          <VisuallyHidden>{t(`avatar.status.${status}`)}</VisuallyHidden>
        </>
      )}
    </span>
  )
}
