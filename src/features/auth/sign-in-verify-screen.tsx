import { useSignIn } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'

import { Button } from '@/components/button/button'
import { SIGN_IN_PATH } from '@/constants/routes'

import { AuthCard } from './auth-card'
import { withRedirect } from './redirect'
import { useFinishAuth } from './use-finish-auth'
import { useRedirectPath } from './use-redirect-path'
import { VerifyCodeForm } from './verify-code-form'

const VERIFIABLE_STATUSES = new Set([
  'needs_client_trust',
  'needs_second_factor',
])

export function SignInVerifyScreen() {
  const { t } = useTranslation()
  const { signIn } = useSignIn()
  const navigate = useNavigate()
  const finishAuth = useFinishAuth()
  const redirectPath = useRedirectPath()
  const signInPath = withRedirect(SIGN_IN_PATH, redirectPath)

  const [canVerify] = useState(() => VERIFIABLE_STATUSES.has(signIn.status))

  if (!canVerify) {
    return <Navigate to={signInPath} replace />
  }

  const email = signIn.supportedSecondFactors.find(
    (factor) => factor.strategy === 'email_code',
  )?.safeIdentifier

  async function verify(code: string) {
    const { error } = await signIn.mfa.verifyEmailCode({ code })

    if (error || signIn.status !== 'complete') {
      return { error }
    }

    return signIn.finalize({ navigate: finishAuth })
  }

  async function startOver() {
    await signIn.reset()
    void navigate(signInPath, { replace: true })
  }

  return (
    <AuthCard
      layout="verification"
      title={t('auth.verify.title')}
      description={
        email
          ? t('auth.deviceVerify.description', { email })
          : t('auth.deviceVerify.descriptionFallback')
      }
      footer={
        <Button variant="link" onClick={() => void startOver()}>
          {t('auth.verify.useAnotherAccount')}
        </Button>
      }
    >
      <VerifyCodeForm
        submitLabel={t('auth.verify.submit')}
        onVerify={verify}
        onResend={() => signIn.mfa.sendEmailCode()}
      />
    </AuthCard>
  )
}
