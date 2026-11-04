import type { SignUpFutureResource } from '@clerk/react/types'

import { SIGN_UP_CONTINUE_PATH, SIGN_UP_VERIFY_PATH } from '@/constants/routes'

export type SignUpNextStep =
  | { kind: 'complete'; error: null }
  | { kind: 'navigate'; path: string; error: null }
  | { kind: 'unsupported'; error: null }
  | { kind: 'error'; error: unknown }

/**
 * Works out what a sign-up still needs: fields to fill in on the continue
 * page, or an email to verify, in which case it sends the code first.
 */
export async function getSignUpNextStep(
  signUp: SignUpFutureResource,
): Promise<SignUpNextStep> {
  if (signUp.status === 'complete') {
    return { kind: 'complete', error: null }
  }

  if (signUp.status !== 'missing_requirements') {
    return { kind: 'unsupported', error: null }
  }

  if (signUp.missingFields.length > 0) {
    return { kind: 'navigate', path: SIGN_UP_CONTINUE_PATH, error: null }
  }

  if (signUp.unverifiedFields.includes('email_address')) {
    const { error } = await signUp.verifications.sendEmailCode()

    return error
      ? { kind: 'error', error }
      : { kind: 'navigate', path: SIGN_UP_VERIFY_PATH, error: null }
  }

  return { kind: 'unsupported', error: null }
}
