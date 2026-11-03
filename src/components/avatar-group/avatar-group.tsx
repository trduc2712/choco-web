import { useTranslation } from 'react-i18next'

import type { AvatarSize } from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import { cx } from '@/lib/cx'

import styles from './avatar-group.module.scss'

export type AvatarGroupPerson = {
  id: string
  name: string
  src?: string
}

export type AvatarGroupProps = {
  label: string
  people: AvatarGroupPerson[]
  max?: number
  size?: AvatarSize
  className?: string
}

export function AvatarGroup({
  label,
  people,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const { t } = useTranslation()
  const visible = people.length > max ? people.slice(0, max - 1) : people
  const hiddenCount = people.length - visible.length

  return (
    <ul className={cx(styles.root, styles[size], className)} aria-label={label}>
      {visible.map((person) => (
        <li key={person.id} className={styles.item}>
          <Avatar name={person.name} src={person.src} size={size} />
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className={styles.item}>
          <span
            className={styles.more}
            role="img"
            aria-label={t('avatarGroup.more', { count: hiddenCount })}
          >
            <span aria-hidden="true">+{hiddenCount}</span>
          </span>
        </li>
      )}
    </ul>
  )
}
