import { SignIn } from '@clerk/react'

import { SIGN_IN_PATH, SIGN_UP_PATH } from '@/constants/routes'

import styles from './sign-in-page.module.scss'

export function SignInPage() {
  return (
    <main className={styles.page}>
      <SignIn routing="path" path={SIGN_IN_PATH} signUpUrl={SIGN_UP_PATH} />
    </main>
  )
}
