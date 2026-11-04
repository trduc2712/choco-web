import { AccountMenu } from '@/features/auth/account-menu'

import styles from './header.module.scss'

export function Header() {
  return (
    <header className={styles.header}>
      <AccountMenu />
    </header>
  )
}
