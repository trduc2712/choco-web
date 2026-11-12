import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import { Text } from '@/components/text/text'
import { Textarea } from '@/components/textarea/textarea'
import { useToast } from '@/components/toast/use-toast'
import { useRefreshOnDenied } from '@/features/roles'
import { apiFieldErrors } from '@/lib/api-errors'

import {
  SUSPENSION_REASON_MAX_LENGTH,
  useLiftSuspension,
  useSuspendUser,
} from './suspension-api'
import { suspensionErrorMessage } from './suspension-errors'
import type { AdminUser } from './users-admin-api'

type SuspensionDialogProps = {
  user: AdminUser
  onClose: () => void
}

function displayName(user: AdminUser) {
  return user.displayName || user.username
}

// Asks for the reason the suspended user will read, then asks again with the
// reason in view before anything is sent. Mount it only while it is open, so
// every opening starts empty.
export function SuspendDialog({ user, onClose }: SuspensionDialogProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [reason, setReason] = useState('')
  const [step, setStep] = useState<'reason' | 'confirm'>('reason')
  const [hasTriedContinue, setHasTriedContinue] = useState(false)
  const { mutate, isPending, error, reset } = useSuspendUser()
  useRefreshOnDenied(error)

  const trimmed = reason.trim()
  const isTooLong = trimmed.length > SUSPENSION_REASON_MAX_LENGTH
  let localError: string | undefined
  if (hasTriedContinue && trimmed.length === 0) {
    localError = t('admin.users.suspension.reasonRequired')
  } else if (isTooLong) {
    localError = t('admin.users.suspension.reasonTooLong', {
      max: SUSPENSION_REASON_MAX_LENGTH,
    })
  }
  const fieldError = localError ?? apiFieldErrors(error, t).reason

  function handleContinue() {
    setHasTriedContinue(true)
    if (trimmed.length > 0 && !isTooLong) setStep('confirm')
  }

  function handleConfirm() {
    mutate(
      { id: user.id, reason: trimmed },
      {
        onSuccess: () => {
          showToast({
            tone: 'success',
            title: t('admin.users.suspension.suspended', {
              name: displayName(user),
            }),
          })
          onClose()
        },
        // Back to the reason, where a field error shows on its field.
        onError: () => setStep('reason'),
      },
    )
  }

  return (
    <Dialog
      isOpen
      onClose={isPending ? () => undefined : onClose}
      title={t('admin.users.suspension.suspendTitle', {
        name: displayName(user),
      })}
      description={
        step === 'reason'
          ? t('admin.users.suspension.suspendDescription')
          : t('admin.users.suspension.confirmDescription')
      }
      footer={
        step === 'reason' ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              {t('admin.users.suspension.cancel')}
            </Button>
            <Button onClick={handleContinue}>
              {t('admin.users.suspension.continue')}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => setStep('reason')}
            >
              {t('admin.users.suspension.back')}
            </Button>
            <Button
              variant="danger"
              isLoading={isPending}
              onClick={handleConfirm}
            >
              {t('admin.users.suspension.confirmSuspend')}
            </Button>
          </>
        )
      }
    >
      {error && !fieldError ? (
        <Alert tone="danger" role="alert" onDismiss={reset}>
          {suspensionErrorMessage(error, t)}
        </Alert>
      ) : null}

      {step === 'reason' ? (
        <Textarea
          label={t('admin.users.suspension.reason')}
          hint={t('admin.users.suspension.counter', {
            count: trimmed.length,
            max: SUSPENSION_REASON_MAX_LENGTH,
          })}
          error={fieldError}
          required
          rows={3}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value)
            if (error) reset()
          }}
        />
      ) : (
        <Text>{trimmed}</Text>
      )}
    </Dialog>
  )
}

// One confirmation. Lifting the suspension of a user who is not suspended is
// accepted too, so the dialog does not claim the user is suspended.
export function LiftSuspensionDialog({ user, onClose }: SuspensionDialogProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { mutate, isPending, error, reset } = useLiftSuspension()
  useRefreshOnDenied(error)

  function handleConfirm() {
    mutate(user.id, {
      onSuccess: () => {
        showToast({
          tone: 'success',
          title: t('admin.users.suspension.lifted', {
            name: displayName(user),
          }),
        })
        onClose()
      },
    })
  }

  return (
    <AlertDialog
      isOpen
      tone="primary"
      title={t('admin.users.suspension.liftTitle', { name: displayName(user) })}
      description={t('admin.users.suspension.liftDescription')}
      confirmLabel={t('admin.users.suspension.confirmLift')}
      cancelLabel={t('admin.users.suspension.cancel')}
      isConfirming={isPending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      {error ? (
        <Alert tone="danger" role="alert" onDismiss={reset}>
          {suspensionErrorMessage(error, t)}
        </Alert>
      ) : null}
    </AlertDialog>
  )
}
