import type { SignInFutureResource } from '@clerk/react/types'

export type SignInNextStep = 'complete' | 'verify-device' | 'unsupported'

/**
 * Works out what a sign-in needs after its first factor, and sends the email
 * code when Clerk asks the user to confirm a new device.
 */
export async function getSignInNextStep(
  signIn: SignInFutureResource,
): Promise<{ step: SignInNextStep; error: unknown }> {
  if (signIn.status === 'complete') {
    return { step: 'complete', error: null }
  }

  const needsCode =
    signIn.status === 'needs_client_trust' ||
    signIn.status === 'needs_second_factor'
  const hasEmailCode = signIn.supportedSecondFactors.some(
    (factor) => factor.strategy === 'email_code',
  )

  if (needsCode && hasEmailCode) {
    const { error } = await signIn.mfa.sendEmailCode()

    return { step: 'verify-device', error }
  }

  return { step: 'unsupported', error: null }
}
