import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

export type HeaderProps = {
  children?: ReactNode
  className?: string
}

export function Header({ children, className }: HeaderProps) {
  return <header className={cx('header-header', className)}>{children}</header>
}
