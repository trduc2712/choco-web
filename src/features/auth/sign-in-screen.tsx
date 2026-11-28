import { useSignIn } from '@clerk/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'
import { useNavigate } from 'react-router'
import { z } from 'zod'

import {
  RESET_PASSWORD_PATH,
  SIGN_IN_VERIFY_PATH,
  SIGN_UP_PATH,
  SSO_CALLBACK_PATH,
} from '@/constants/routes'

import { AuthCard } from './auth-card'
import { applyClerkError } from './clerk-errors'
import { GoogleButton } from './google-button'
import { withRedirect } from './redirect'
import { getSignInNextStep } from './sign-in-next-step'
import { useFinishAuth } from './use-finish-auth'
import { useRedirectPath } from './use-redirect-path'
import { useSsoRedirectState } from './use-sso-redirect-state'

type Values = { identifier: string; password: string }

export function SignInScreen() {
  const { t } = useTranslation()
  const { signIn } = useSignIn()
  const navigate = useNavigate()
  const finishAuth = useFinishAuth()
  const redirectPath = useRedirectPath()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string>()
  const [isRedirecting, setIsRedirecting] = useSsoRedirectState()
  const schema = useMemo(
    () =>
      z.object({
        identifier: z.string().trim().min(1, t('auth.errors.required')),
        password: z.string().min(1, t('auth.errors.required')),
      }),
    [t],
  )
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  })

  const { errors, isSubmitting } = form.formState

  function showError(clerkError: unknown) {
    setError(
      applyClerkError({
        error: clerkError,
        setError: form.setError,
        fields: { identifier: 'identifier', password: 'password' },
        t,
      }),
    )
  }

  async function submit({ identifier, password }: Values) {
    setError(undefined)
    const { error: passwordError } = await signIn.password({
      identifier,
      password,
    })

    if (passwordError) {
      showError(passwordError)
      return
    }

    const next = await getSignInNextStep(signIn)

    if (next.error) {
      showError(next.error)
    } else if (next.step === 'complete') {
      const { error: finalizeError } = await signIn.finalize({
        navigate: finishAuth,
      })

      if (finalizeError) {
        showError(finalizeError)
      }
    } else if (next.step === 'verify-device') {
      void navigate(withRedirect(SIGN_IN_VERIFY_PATH, redirectPath))
    } else {
      setError(t('auth.errors.secondFactorUnsupported'))
    }
  }

  async function continueWithGoogle() {
    setError(undefined)
    setIsRedirecting(true)
    const { error: ssoError } = await signIn.sso({
      strategy: 'oauth_google',
      redirectUrl: redirectPath,
      redirectCallbackUrl: withRedirect(SSO_CALLBACK_PATH, redirectPath),
    })

    if (ssoError) {
      setIsRedirecting(false)
      showError(ssoError)
    }
  }

  return (
    <AuthCard
      title={t('auth.signIn.title')}
      description={t('auth.signIn.description')}
      error={error}
      footer={
        <>
          {t('auth.signIn.noAccount')}{' '}
          <RouterLink to={withRedirect(SIGN_UP_PATH, redirectPath)}>
            {t('auth.signIn.signUp')}
          </RouterLink>
        </>
      }
    >
      <GoogleButton
        isLoading={isRedirecting}
        onClick={() => void continueWithGoogle()}
      />
      <p>{t('auth.or')}</p>
      <form noValidate onSubmit={form.handleSubmit(submit)}>
        <div>
          <label htmlFor="sign-in-identifier">
            {t('auth.fields.identifier')}
          </label>
          <input
            id="sign-in-identifier"
            {...form.register('identifier')}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={errors.identifier ? true : undefined}
            aria-describedby={
              errors.identifier ? 'sign-in-identifier-error' : undefined
            }
          />
          {errors.identifier && (
            <p id="sign-in-identifier-error">{errors.identifier.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="sign-in-password">{t('auth.fields.password')}</label>
          <input
            id="sign-in-password"
            {...form.register('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? 'sign-in-password-error' : undefined
            }
          />
          <button
            type="button"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {t(showPassword ? 'passwordInput.hide' : 'passwordInput.show')}
          </button>
          {errors.password && (
            <p id="sign-in-password-error">{errors.password.message}</p>
          )}
        </div>
        <p>
          <RouterLink to={withRedirect(RESET_PASSWORD_PATH, redirectPath)}>
            {t('auth.signIn.forgotPassword')}
          </RouterLink>
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
        >
          {t('auth.signIn.submit')}
        </button>
      </form>
    </AuthCard>
  )
}
