import { useSignUp } from '@clerk/react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { withRedirect } from './redirect'
import { getSignUpNextStep } from './sign-up-next-step'
import { useFinishAuth } from './use-finish-auth'
import { useRedirectPath } from './use-redirect-path'

/**
 * Moves a sign-up on to its next step and returns the error to show, if any.
 */
export function useContinueSignUp() {
  const { t } = useTranslation()
  const { signUp } = useSignUp()
  const navigate = useNavigate()
  const finishAuth = useFinishAuth()
  const redirectPath = useRedirectPath()

  return useCallback(async (): Promise<{
    error: unknown
    message?: string
  }> => {
    const next = await getSignUpNextStep(signUp)

    if (next.kind === 'complete') {
      return signUp.finalize({ navigate: finishAuth })
    }

    if (next.kind === 'navigate') {
      void navigate(withRedirect(next.path, redirectPath))
    }

    if (next.kind === 'unsupported') {
      return { error: null, message: t('auth.continueSignUp.unsupported') }
    }

    return { error: next.error }
  }, [finishAuth, navigate, redirectPath, signUp, t])
}
