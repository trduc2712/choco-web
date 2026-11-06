import { useSignUp } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'

import { Link } from '@/components/link/link'
import { SIGN_UP_PATH } from '@/constants/routes'
import { AuthCard } from '@/features/auth/auth-card'
import { withRedirect } from '@/features/auth/redirect'
import { useContinueSignUp } from '@/features/auth/use-continue-sign-up'
import { useRedirectPath } from '@/features/auth/use-redirect-path'
import { VerifyCodeForm } from '@/features/auth/verify-code-form'

export function SignUpVerifyPage() {
  const { t } = useTranslation()
  const { signUp } = useSignUp()
  const continueSignUp = useContinueSignUp()
  const redirectPath = useRedirectPath()
  const signUpPath = withRedirect(SIGN_UP_PATH, redirectPath)

  const [canVerify] = useState(
    () =>
      signUp.status === 'missing_requirements' &&
      signUp.unverifiedFields.includes('email_address'),
  )

  if (!canVerify) {
    return <Navigate to={signUpPath} replace />
  }

  const email = signUp.emailAddress

  async function verify(code: string) {
    const { error } = await signUp.verifications.verifyEmailCode({ code })

    return error ? { error } : continueSignUp()
  }

  return (
    <AuthCard
      layout="verification"
      title={t('auth.verify.title')}
      description={
        email
          ? t('auth.verify.description', { email })
          : t('auth.verify.descriptionFallback')
      }
      footer={<Link to={signUpPath}>{t('auth.continueSignUp.startOver')}</Link>}
    >
      <VerifyCodeForm
        submitLabel={t('auth.verify.submit')}
        onVerify={verify}
        onResend={() => signUp.verifications.sendEmailCode()}
      />
    </AuthCard>
  )
}
