import type { ReactNode } from 'react'

import styles from './header.module.scss'

export type HeaderProps = {
  children?: ReactNode
}

export function Header({ children }: HeaderProps) {
  return <header className={styles.header}>{children}</header>
}
