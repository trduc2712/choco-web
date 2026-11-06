import { useSignIn } from '@clerk/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { z } from 'zod'

import { Divider } from '@/components/divider/divider'
import { Form, FormField, FormSubmit } from '@/components/form/form'
import { Input } from '@/components/input/input'
import { Link } from '@/components/link/link'
import { PasswordInput } from '@/components/password-input/password-input'
import { Stack } from '@/components/stack/stack'
import {
  RESET_PASSWORD_PATH,
  SIGN_IN_VERIFY_PATH,
  SIGN_UP_PATH,
  SSO_CALLBACK_PATH,
} from '@/constants/routes'
import { AuthCard } from '@/features/auth/auth-card'
import { applyClerkError } from '@/features/auth/clerk-errors'
import { GoogleButton } from '@/features/auth/google-button'
import { withRedirect } from '@/features/auth/redirect'
import { getSignInNextStep } from '@/features/auth/sign-in-next-step'
import { useFinishAuth } from '@/features/auth/use-finish-auth'
import { useRedirectPath } from '@/features/auth/use-redirect-path'
import { useSsoRedirectState } from '@/features/auth/use-sso-redirect-state'

type Values = { identifier: string; password: string }

export function SignInPage() {
  const { t } = useTranslation()
  const { signIn } = useSignIn()
  const navigate = useNavigate()
  const finishAuth = useFinishAuth()
  const redirectPath = useRedirectPath()
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
          <Link to={withRedirect(SIGN_UP_PATH, redirectPath)}>
            {t('auth.signIn.signUp')}
          </Link>
        </>
      }
    >
      <GoogleButton
        isLoading={isRedirecting}
        onClick={() => void continueWithGoogle()}
      />
      <Divider label={t('auth.or')} />
      <Form form={form} onSubmit={submit}>
        <FormField<Values, 'identifier'>
          name="identifier"
          render={({ field, error: fieldError }) => (
            <Input
              {...field}
              label={t('auth.fields.identifier')}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              error={fieldError}
              required
            />
          )}
        />
        <Stack gap={2}>
          <FormField<Values, 'password'>
            name="password"
            render={({ field, error: fieldError }) => (
              <PasswordInput
                {...field}
                label={t('auth.fields.password')}
                error={fieldError}
                required
              />
            )}
          />
          <Link
            variant="subtle"
            to={withRedirect(RESET_PASSWORD_PATH, redirectPath)}
          >
            {t('auth.signIn.forgotPassword')}
          </Link>
        </Stack>
        <FormSubmit isFullWidth>{t('auth.signIn.submit')}</FormSubmit>
      </Form>
    </AuthCard>
  )
}
