import { cx } from '@/lib/cx'

import styles from './icon.module.scss'
import type { IconName } from './icon-paths'
import { ICON_PATHS } from './icon-paths'

export type IconSize = 'sm' | 'md' | 'lg' | 'xl'

export type IconProps = {
  name: IconName
  size?: IconSize
  label?: string
  className?: string
}

export function Icon({ name, size = 'md', label, className }: IconProps) {
  return (
    <svg
      className={cx(styles.root, styles[size], className)}
      viewBox="0 0 24 24"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
