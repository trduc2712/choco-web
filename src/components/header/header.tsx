import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

import styles from './header.module.scss'

export type HeaderProps = {
  children?: ReactNode
  className?: string
}

export function Header({ children, className }: HeaderProps) {
  return <header className={cx(styles.header, className)}>{children}</header>
}
