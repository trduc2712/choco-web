import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import { RadioGroup } from '@/components/radio-group/radio-group'
import { Textarea } from '@/components/textarea/textarea'
import { useToast } from '@/components/toast/use-toast'
import { useSuspension } from '@/features/current-user'
import { ApiError, isSuspendedError } from '@/lib/api-client'
import { apiFieldErrors } from '@/lib/api-errors'

import type { ReportTarget } from './create-report-api'
import { REPORT_DETAILS_MAX_LENGTH, useCreateReport } from './create-report-api'
import type { ReportReason } from './reports-api'
import { REPORT_REASONS } from './reports-api'

type ReportDialogProps = {
  target: ReportTarget
  onClose: () => void
}

// A sentence for a failure that is not a field error. A suspended account is
// explained once by the API client; here the dialog just says it cannot send.
function failureMessage(
  error: unknown,
  target: ReportTarget,
  t: (key: string) => string,
) {
  if (isSuspendedError(error)) return t('reports.dialog.suspended')
  if (error instanceof ApiError) {
    if (error.status === 404) return t(`reports.dialog.notFound.${target.type}`)
    if (error.status === 400) return t(`reports.dialog.own.${target.type}`)
  }
  return t('reports.dialog.error')
}

// Asks why, and for an optional explanation, then reports a post or a user to
// the administrators. Mount it only while it is open, so every opening starts
// empty. The reporter is never shown to the person reported.
export function ReportDialog({ target, onClose }: ReportDialogProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { isSuspended } = useSuspension()
  const [reason, setReason] = useState<ReportReason>()
  const [details, setDetails] = useState('')
  const [hasTriedSend, setHasTriedSend] = useState(false)
  const { mutate, isPending, error, reset } = useCreateReport()

  const trimmed = details.trim()
  const isTooLong = trimmed.length > REPORT_DETAILS_MAX_LENGTH
  const fieldErrors = apiFieldErrors(error, t)
  const reasonError =
    hasTriedSend && !reason
      ? t('reports.dialog.reasonRequired')
      : fieldErrors.reason
  const detailsError = isTooLong
    ? t('reports.dialog.detailsTooLong', { max: REPORT_DETAILS_MAX_LENGTH })
    : fieldErrors.details
  const hasFieldError = Boolean(fieldErrors.reason ?? fieldErrors.details)

  function handleSend() {
    setHasTriedSend(true)
    if (!reason || isTooLong) return
    mutate(
      { target, reason, details: trimmed || null },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: t('reports.dialog.sent') })
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      isOpen
      onClose={isPending ? () => undefined : onClose}
      title={t(`reports.dialog.title.${target.type}`)}
      description={t('reports.dialog.description')}
      footer={
        <>
          <Button variant="secondary" disabled={isPending} onClick={onClose}>
            {t('reports.dialog.cancel')}
          </Button>
          <Button
            variant="danger"
            isLoading={isPending}
            disabled={isSuspended}
            onClick={handleSend}
          >
            {t('reports.dialog.send')}
          </Button>
        </>
      }
    >
      {error && !hasFieldError ? (
        <Alert tone="danger" role="alert" onDismiss={reset}>
          {failureMessage(error, target, t as (key: string) => string)}
        </Alert>
      ) : null}

      <RadioGroup
        label={t('reports.dialog.reason')}
        name="report-reason"
        isRequired
        value={reason}
        error={reasonError}
        options={REPORT_REASONS.map((value) => ({
          value,
          label: t(`admin.reports.reasons.${value}`),
        }))}
        onChange={(value) => {
          setReason(value as ReportReason)
          if (error) reset()
        }}
      />
      <Textarea
        label={t('reports.dialog.details')}
        hint={t('reports.dialog.counter', {
          count: trimmed.length,
          max: REPORT_DETAILS_MAX_LENGTH,
        })}
        error={detailsError}
        rows={3}
        value={details}
        onChange={(event) => {
          setDetails(event.target.value)
          if (error) reset()
        }}
      />
    </Dialog>
  )
}
