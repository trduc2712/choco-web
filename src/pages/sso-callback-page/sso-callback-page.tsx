import { HandleSSOCallback, useSignIn } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Spinner } from '@/components/spinner/spinner'
import {
  SIGN_IN_PATH,
  SIGN_IN_VERIFY_PATH,
  SIGN_UP_PATH,
} from '@/constants/routes'
import { withRedirect } from '@/features/auth/redirect'
import { getSignInNextStep } from '@/features/auth/sign-in-next-step'
import { useContinueSignUp } from '@/features/auth/use-continue-sign-up'
import { useFinishAuth } from '@/features/auth/use-finish-auth'
import { useRedirectPath } from '@/features/auth/use-redirect-path'

import styles from './sso-callback-page.module.scss'

export function SsoCallbackPage() {
  const { t } = useTranslation()
  const { signIn } = useSignIn()
  const navigate = useNavigate()
  const finishAuth = useFinishAuth()
  const continueSignUp = useContinueSignUp()
  const redirectPath = useRedirectPath()

  async function goToSignIn() {
    const next = await getSignInNextStep(signIn)
    const path =
      next.step === 'verify-device' && !next.error
        ? SIGN_IN_VERIFY_PATH
        : SIGN_IN_PATH

    void navigate(withRedirect(path, redirectPath), { replace: true })
  }

  async function goToSignUp() {
    const result = await continueSignUp()

    if (result.error || result.message) {
      void navigate(withRedirect(SIGN_UP_PATH, redirectPath), { replace: true })
    }
  }

  return (
    <main className={styles.page}>
      <Spinner size="lg" label={t('auth.ssoCallback.label')} />
      <HandleSSOCallback
        navigateToApp={finishAuth}
        navigateToSignIn={() => void goToSignIn()}
        navigateToSignUp={() => void goToSignUp()}
      />
    </main>
  )
}
