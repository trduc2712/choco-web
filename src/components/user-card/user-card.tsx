import type { ReactNode } from 'react'

import type {
  AvatarFallback,
  AvatarFallbackColor,
  AvatarShape,
  AvatarSize,
} from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import { Highlight } from '@/components/highlight/highlight'
import { Text } from '@/components/text/text'
import { cx } from '@/lib/cx'

import styles from './user-card.module.scss'

export type UserCardProps = {
  name: string
  // The line under the name, usually "@username".
  description?: string
  src?: string
  fallbackColor?: AvatarFallbackColor
  fallback?: AvatarFallback
  size?: AvatarSize
  shape?: AvatarShape
  // Keeps each line to one line and ends it with an ellipsis.
  isTruncated?: boolean
  // Hides the avatar from assistive technology, for a card that sits in a link
  // or option the name already labels.
  isAvatarHidden?: boolean
  // A phrase to mark in the name and the description, such as a search query.
  highlight?: string
  // Content after the text, such as a chevron.
  trailing?: ReactNode
  className?: string
}

// A person in two columns: the avatar, then the name over a description.
export function UserCard({
  name,
  description,
  src,
  fallbackColor,
  fallback,
  size = 'md',
  shape = 'circle',
  isTruncated = false,
  isAvatarHidden = false,
  highlight,
  trailing,
  className,
}: UserCardProps) {
  return (
    <span
      className={cx(
        styles.root,
        trailing !== undefined && styles.withTrailing,
        className,
      )}
    >
      <span className={styles.avatar} aria-hidden={isAvatarHidden || undefined}>
        <Avatar
          name={name}
          src={src}
          fallbackColor={fallbackColor}
          fallback={fallback}
          size={size}
          shape={shape}
        />
      </span>
      <span className={styles.text}>
        <Text
          as="span"
          size={size === 'lg' || size === 'xl' ? 'md' : 'sm'}
          weight="semibold"
          isTruncated={isTruncated}
        >
          <bdi>
            {highlight ? (
              <Highlight text={name} query={highlight} isPhrase />
            ) : (
              name
            )}
          </bdi>
        </Text>
        {description ? (
          <Text as="span" size="xs" tone="muted" isTruncated={isTruncated}>
            <bdi>
              {highlight ? (
                <Highlight text={description} query={highlight} isPhrase />
              ) : (
                description
              )}
            </bdi>
          </Text>
        ) : null}
      </span>
      {trailing}
    </span>
  )
}
