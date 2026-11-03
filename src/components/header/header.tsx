import { UserButton } from '@clerk/react'

import { ThemeToggle } from '@/features/theme/theme-toggle'

import styles from './header.module.scss'

export function Header() {
  return (
    <header className={styles.header}>
      <ThemeToggle />
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: {
              width: 'var(--size-avatar-sm)',
              height: 'var(--size-avatar-sm)',
            },
          },
        }}
      />
    </header>
  )
}
