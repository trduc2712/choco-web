import type { ComponentProps } from 'react'

import { cx } from '@/lib/cx'

import styles from './visually-hidden.module.scss'

export type VisuallyHiddenProps = ComponentProps<'span'>

export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  return <span {...props} className={cx(styles.root, className)} />
}
