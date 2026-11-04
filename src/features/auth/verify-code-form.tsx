import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Form, FormField, FormSubmit } from '@/components/form/form'
import { PinInput } from '@/components/pin-input/pin-input'
import { Stack } from '@/components/stack/stack'

import { applyClerkError } from './clerk-errors'

export const CODE_LENGTH = 6

export type ClerkResult = { error: unknown }

export type VerifyCodeFormProps = {
  submitLabel: string
  onVerify: (code: string) => Promise<ClerkResult>
  onResend: () => Promise<ClerkResult>
}

type Values = { code: string }

export function VerifyCodeForm({
  submitLabel,
  onVerify,
  onResend,
}: VerifyCodeFormProps) {
  const { t } = useTranslation()
  const schema = useMemo(
    () =>
      z.object({
        code: z.string().regex(/^\d{6}$/, t('auth.validation.code')),
      }),
    [t],
  )
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  })
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [isResending, setIsResending] = useState(false)

  async function verify({ code }: Values) {
    setError(undefined)
    setNotice(undefined)
    const result = await onVerify(code)

    if (result.error) {
      setError(
        applyClerkError({
          error: result.error,
          setError: form.setError,
          fields: { code: 'code' },
          t,
        }),
      )
    }
  }

  async function resend() {
    setError(undefined)
    setNotice(undefined)
    setIsResending(true)
    const result = await onResend()
    setIsResending(false)

    if (result.error) {
      setError(
        applyClerkError({
          error: result.error,
          setError: form.setError,
          fields: {},
          t,
        }),
      )
    } else {
      form.reset({ code: '' })
      setNotice(t('auth.verify.resent'))
    }
  }

  return (
    <Stack gap={4}>
      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}
      {notice && (
        <Alert tone="success" role="status">
          {notice}
        </Alert>
      )}
      <Form form={form} onSubmit={verify}>
        <FormField<Values, 'code'>
          name="code"
          render={({ field, error: fieldError }) => (
            <PinInput
              label={t('auth.fields.code')}
              length={CODE_LENGTH}
              value={field.value}
              onChange={field.onChange}
              onComplete={() => void form.handleSubmit(verify)()}
              error={fieldError}
              isDisabled={form.formState.isSubmitting}
            />
          )}
        />
        <FormSubmit isFullWidth>{submitLabel}</FormSubmit>
      </Form>
      <Button
        variant="ghost"
        isFullWidth
        isLoading={isResending}
        onClick={() => void resend()}
      >
        {t('auth.verify.resend')}
      </Button>
    </Stack>
  )
}
