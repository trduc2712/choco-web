import { useSignUp } from '@clerk/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Divider } from '@/components/divider/divider'
import { Form, FormField, FormSubmit } from '@/components/form/form'
import { Input } from '@/components/input/input'
import { Link } from '@/components/link/link'
import { PasswordInput } from '@/components/password-input/password-input'
import { SIGN_IN_PATH, SSO_CALLBACK_PATH } from '@/constants/routes'
import { AuthCard } from '@/features/auth/auth-card'
import { ClerkCaptcha } from '@/features/auth/clerk-captcha'
import { applyClerkError } from '@/features/auth/clerk-errors'
import { GoogleButton } from '@/features/auth/google-button'
import { withRedirect } from '@/features/auth/redirect'
import { useContinueSignUp } from '@/features/auth/use-continue-sign-up'
import { useRedirectPath } from '@/features/auth/use-redirect-path'

type Values = { email: string; username: string; password: string }

export function SignUpPage() {
  const { t } = useTranslation()
  const { signUp } = useSignUp()
  const continueSignUp = useContinueSignUp()
  const redirectPath = useRedirectPath()
  const [error, setError] = useState<string>()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .pipe(z.email(t('auth.validation.email'))),
        username: z.string().trim().min(1, t('auth.errors.required')),
        password: z.string().min(1, t('auth.errors.required')),
      }),
    [t],
  )
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', username: '', password: '' },
  })

  function showError(clerkError: unknown) {
    setError(
      applyClerkError({
        error: clerkError,
        setError: form.setError,
        fields: {
          email_address: 'email',
          username: 'username',
          password: 'password',
        },
        t,
      }),
    )
  }

  async function submit({ email, username, password }: Values) {
    setError(undefined)
    const { error: passwordError } = await signUp.password({
      emailAddress: email,
      username,
      password,
    })

    if (passwordError) {
      showError(passwordError)
      return
    }

    const result = await continueSignUp()

    if (result.error) {
      showError(result.error)
    } else if (result.message) {
      setError(result.message)
    }
  }

  async function continueWithGoogle() {
    setError(undefined)
    setIsRedirecting(true)
    const { error: ssoError } = await signUp.sso({
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
      title={t('auth.signUp.title')}
      description={t('auth.signUp.description')}
      error={error}
      footer={
        <>
          {t('auth.signUp.hasAccount')}{' '}
          <Link to={withRedirect(SIGN_IN_PATH, redirectPath)}>
            {t('auth.signUp.signIn')}
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
        <FormField<Values, 'email'>
          name="email"
          render={({ field, error: fieldError }) => (
            <Input
              {...field}
              label={t('auth.fields.email')}
              type="email"
              autoComplete="email"
              error={fieldError}
              required
            />
          )}
        />
        <FormField<Values, 'username'>
          name="username"
          render={({ field, error: fieldError }) => (
            <Input
              {...field}
              label={t('auth.fields.username')}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              error={fieldError}
              required
            />
          )}
        />
        <FormField<Values, 'password'>
          name="password"
          render={({ field, error: fieldError }) => (
            <PasswordInput
              {...field}
              label={t('auth.fields.password')}
              autoComplete="new-password"
              error={fieldError}
              required
            />
          )}
        />
        <ClerkCaptcha />
        <FormSubmit isFullWidth>{t('auth.signUp.submit')}</FormSubmit>
      </Form>
    </AuthCard>
  )
}
