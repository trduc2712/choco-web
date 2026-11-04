import { useSignUp } from '@clerk/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'
import { z } from 'zod'

import { Form, FormField, FormSubmit } from '@/components/form/form'
import { Input } from '@/components/input/input'
import { Link } from '@/components/link/link'
import { SIGN_UP_PATH } from '@/constants/routes'
import { AuthCard } from '@/features/auth/auth-card'
import { ClerkCaptcha } from '@/features/auth/clerk-captcha'
import { applyClerkError } from '@/features/auth/clerk-errors'
import { withRedirect } from '@/features/auth/redirect'
import { useContinueSignUp } from '@/features/auth/use-continue-sign-up'
import { useRedirectPath } from '@/features/auth/use-redirect-path'

type Values = { username: string }

const SUPPORTED_FIELDS = new Set(['username'])

export function SignUpContinuePage() {
  const { t } = useTranslation()
  const { signUp } = useSignUp()
  const continueSignUp = useContinueSignUp()
  const redirectPath = useRedirectPath()
  const signUpPath = withRedirect(SIGN_UP_PATH, redirectPath)
  const [missingFields] = useState(() =>
    signUp.status === 'missing_requirements' ? signUp.missingFields : [],
  )
  const [error, setError] = useState<string>()
  const schema = useMemo(
    () =>
      z.object({
        username: z.string().trim().min(1, t('auth.errors.required')),
      }),
    [t],
  )
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: '' },
  })

  if (missingFields.length === 0) {
    return <Navigate to={signUpPath} replace />
  }

  const footer = (
    <Link to={signUpPath}>{t('auth.continueSignUp.startOver')}</Link>
  )

  if (!missingFields.every((field) => SUPPORTED_FIELDS.has(field))) {
    return (
      <AuthCard
        title={t('auth.continueSignUp.title')}
        error={t('auth.continueSignUp.unsupported')}
        footer={footer}
      />
    )
  }

  function showError(clerkError: unknown) {
    setError(
      applyClerkError({
        error: clerkError,
        setError: form.setError,
        fields: { username: 'username' },
        t,
      }),
    )
  }

  async function submit({ username }: Values) {
    setError(undefined)
    const { error: updateError } = await signUp.update({ username })

    if (updateError) {
      showError(updateError)
      return
    }

    const result = await continueSignUp()

    if (result.error) {
      showError(result.error)
    } else if (result.message) {
      setError(result.message)
    }
  }

  return (
    <AuthCard
      title={t('auth.continueSignUp.title')}
      description={t('auth.continueSignUp.description')}
      error={error}
      footer={footer}
    >
      <Form form={form} onSubmit={submit}>
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
        <ClerkCaptcha />
        <FormSubmit isFullWidth>{t('auth.continueSignUp.submit')}</FormSubmit>
      </Form>
    </AuthCard>
  )
}
