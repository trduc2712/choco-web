import type { ComponentProps } from 'react'

import { cx } from '@/lib/cx'

import styles from './kbd.module.scss'

export type KbdProps = ComponentProps<'kbd'>

export function Kbd({ className, ...props }: KbdProps) {
  return <kbd {...props} className={cx(styles.root, className)} />
}
