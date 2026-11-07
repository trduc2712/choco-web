import { useSignIn } from '@clerk/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { z } from 'zod'

import { Form, FormField, FormSubmit } from '@/components/form/form'
import { Input } from '@/components/input/input'
import { Link } from '@/components/link/link'
import { PasswordInput } from '@/components/password-input/password-input'
import { SIGN_IN_PATH, SIGN_IN_VERIFY_PATH } from '@/constants/routes'

import { AuthCard } from './auth-card'
import { applyClerkError } from './clerk-errors'
import { withRedirect } from './redirect'
import { getSignInNextStep } from './sign-in-next-step'
import { useFinishAuth } from './use-finish-auth'
import { useRedirectPath } from './use-redirect-path'
import { VerifyCodeForm } from './verify-code-form'

type Step = 'email' | 'code' | 'password'

type EmailValues = { email: string }

type PasswordValues = { password: string }

export function ResetPasswordScreen() {
  const { t } = useTranslation()
  const { signIn } = useSignIn()
  const navigate = useNavigate()
  const finishAuth = useFinishAuth()
  const redirectPath = useRedirectPath()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const emailSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .pipe(z.email(t('auth.validation.email'))),
      }),
    [t],
  )
  const passwordSchema = useMemo(
    () => z.object({ password: z.string().min(1, t('auth.errors.required')) }),
    [t],
  )
  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  })

  async function sendCode({ email: emailAddress }: EmailValues) {
    setError(undefined)
    const { error: createError } = await signIn.create({
      identifier: emailAddress,
    })
    const { error: sendError } = createError
      ? { error: createError }
      : await signIn.resetPasswordEmailCode.sendCode()

    if (sendError) {
      setError(
        applyClerkError({
          error: sendError,
          setError: emailForm.setError,
          fields: { identifier: 'email', email_address: 'email' },
          t,
        }),
      )
      return
    }

    setEmail(emailAddress)
    setStep('code')
  }

  async function verifyCode(code: string) {
    const result = await signIn.resetPasswordEmailCode.verifyCode({ code })

    if (!result.error && signIn.status === 'needs_new_password') {
      setStep('password')
    }

    return result
  }

  async function submitPassword({ password }: PasswordValues) {
    setError(undefined)
    const { error: submitError } =
      await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      })
    const next = submitError
      ? { step: undefined, error: submitError }
      : await getSignInNextStep(signIn)

    if (next.error) {
      setError(
        applyClerkError({
          error: next.error,
          setError: passwordForm.setError,
          fields: { password: 'password' },
          t,
        }),
      )
    } else if (next.step === 'complete') {
      const { error: finalizeError } = await signIn.finalize({
        navigate: finishAuth,
      })

      if (finalizeError) {
        setError(
          applyClerkError({
            error: finalizeError,
            setError: passwordForm.setError,
            fields: {},
            t,
          }),
        )
      }
    } else if (next.step === 'verify-device') {
      void navigate(withRedirect(SIGN_IN_VERIFY_PATH, redirectPath))
    } else {
      setError(t('auth.errors.secondFactorUnsupported'))
    }
  }

  const backToSignIn = (
    <Link to={withRedirect(SIGN_IN_PATH, redirectPath)}>
      {t('auth.resetPassword.backToSignIn')}
    </Link>
  )

  if (step === 'code') {
    return (
      <AuthCard
        layout="verification"
        title={t('auth.verify.title')}
        description={t('auth.resetPassword.codeDescription', { email })}
        footer={backToSignIn}
      >
        <VerifyCodeForm
          submitLabel={t('auth.resetPassword.verifyCode')}
          onVerify={verifyCode}
          onResend={() => signIn.resetPasswordEmailCode.sendCode()}
        />
      </AuthCard>
    )
  }

  if (step === 'password') {
    return (
      <AuthCard
        title={t('auth.resetPassword.passwordTitle')}
        description={t('auth.resetPassword.passwordDescription')}
        error={error}
        footer={backToSignIn}
      >
        <Form form={passwordForm} onSubmit={submitPassword}>
          <FormField<PasswordValues, 'password'>
            name="password"
            render={({ field, error: fieldError }) => (
              <PasswordInput
                {...field}
                label={t('auth.fields.newPassword')}
                autoComplete="new-password"
                error={fieldError}
                required
              />
            )}
          />
          <FormSubmit isFullWidth>{t('auth.resetPassword.submit')}</FormSubmit>
        </Form>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title={t('auth.resetPassword.title')}
      description={t('auth.resetPassword.description')}
      error={error}
      footer={backToSignIn}
    >
      <Form form={emailForm} onSubmit={sendCode}>
        <FormField<EmailValues, 'email'>
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
        <FormSubmit isFullWidth>{t('auth.resetPassword.sendCode')}</FormSubmit>
      </Form>
    </AuthCard>
  )
}
