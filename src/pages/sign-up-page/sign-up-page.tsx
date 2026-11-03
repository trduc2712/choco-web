import { SignUp } from '@clerk/react'

import { SIGN_IN_PATH, SIGN_UP_PATH } from '@/constants/routes'

import styles from './sign-up-page.module.scss'

export function SignUpPage() {
  return (
    <main className={styles.page}>
      <SignUp routing="path" path={SIGN_UP_PATH} signInUrl={SIGN_IN_PATH} />
    </main>
  )
}
