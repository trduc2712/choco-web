import { vi } from 'vitest'

type Result = { error: unknown }

type NavigateParams = { decorateUrl: (url: string) => string }

const ok = (): Promise<Result> => Promise.resolve({ error: null })

function createFinalize() {
  return vi.fn(
    async (params?: { navigate?: (p: NavigateParams) => unknown }) => {
      await params?.navigate?.({ decorateUrl: (url) => url })
      return { error: null }
    },
  )
}

export function createSignInMock() {
  return {
    status: 'needs_identifier' as string,
    supportedSecondFactors: [] as {
      strategy: string
      safeIdentifier?: string
    }[],
    create: vi.fn(ok),
    password: vi.fn(ok),
    sso: vi.fn(ok),
    reset: vi.fn(ok),
    finalize: createFinalize(),
    mfa: {
      sendEmailCode: vi.fn(ok),
      verifyEmailCode: vi.fn(ok),
    },
    resetPasswordEmailCode: {
      sendCode: vi.fn(ok),
      verifyCode: vi.fn(ok),
      submitPassword: vi.fn(ok),
    },
  }
}

export function createSignUpMock() {
  return {
    status: 'abandoned' as string,
    missingFields: [] as string[],
    unverifiedFields: [] as string[],
    emailAddress: null as string | null,
    password: vi.fn(ok),
    update: vi.fn(ok),
    sso: vi.fn(ok),
    finalize: createFinalize(),
    verifications: {
      sendEmailCode: vi.fn(ok),
      verifyEmailCode: vi.fn(ok),
    },
  }
}

export type SignInMock = ReturnType<typeof createSignInMock>

export type SignUpMock = ReturnType<typeof createSignUpMock>

/**
 * Builds an error shaped like the ClerkAPIResponseError Clerk returns.
 */
export function clerkApiError(code: string, paramName?: string) {
  return { errors: [{ code, meta: paramName ? { paramName } : {} }] }
}
