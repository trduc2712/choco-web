import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog/dialog'
import { RadioGroup } from '@/components/radio-group/radio-group'
import { useToast } from '@/components/toast/use-toast'
import { usePermissions, useRefreshCurrentUser } from '@/features/current-user'
import { ApiError } from '@/lib/api-client'
import type { SymbolName } from '@/lib/symbols'

import { reportErrorMessage } from './report-errors'
import { availableOutcomes } from './report-rules'
import type { ReportOutcome, ReportTargetType } from './reports-api'
import { useResolveReport } from './reports-api'

const OUTCOME_ICONS: Record<ReportOutcome, SymbolName> = {
  Dismissed: 'check-circle',
  ContentRemoved: 'trash',
  UserSuspended: 'ban',
}

type ResolveReportDialogProps = {
  reportId: string
  targetType: ReportTargetType
  // Open reports about the target; resolving closes all of them.
  reportCount?: number
  // The reported user (not a post's author) is suspended already.
  isTargetSuspended?: boolean
  onClose: () => void
}

// Chooses what resolving a report does, then asks again naming the
// consequence before anything is sent. Mount it only while it is open. An
// error keeps it open so the moderator can choose another outcome.
export function ResolveReportDialog({
  reportId,
  targetType,
  reportCount = 1,
  isTargetSuspended = false,
  onClose,
}: ResolveReportDialogProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { granted } = usePermissions()
  const refreshCurrentUser = useRefreshCurrentUser()
  const outcomes = availableOutcomes(targetType, granted, isTargetSuspended)
  const [outcome, setOutcome] = useState<ReportOutcome | undefined>(
    outcomes.length === 1 ? outcomes[0] : undefined,
  )
  const [step, setStep] = useState<'choose' | 'confirm'>('choose')
  const { mutate, isPending, error, reset } = useResolveReport()

  const consequence = (value: ReportOutcome) =>
    t(`admin.reports.consequences.${value}.${targetType}` as never)

  function handleConfirm() {
    if (!outcome) return
    mutate(
      { reportId, outcome },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: t('admin.reports.resolved') })
          onClose()
        },
        onError: (failure) => {
          setStep('choose')
          // The permissions in memory are old: ask GET /me again.
          if (
            failure instanceof ApiError &&
            failure.code === 'Permission.Denied'
          ) {
            void refreshCurrentUser()
          }
        },
      },
    )
  }

  return (
    <Dialog
      isOpen
      onClose={isPending ? () => undefined : onClose}
      title={t('admin.reports.resolveTitle', { count: reportCount })}
      description={
        step === 'choose'
          ? t('admin.reports.resolveDescription')
          : t('admin.reports.confirmDescription')
      }
      footer={
        step === 'choose' ? (
          <>
            <button type="button" onClick={onClose}>
              {t('admin.reports.cancel')}
            </button>
            <button
              type="button"
              disabled={outcome === undefined}
              onClick={() => setStep('confirm')}
            >
              {t('admin.reports.continue')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setStep('choose')}
            >
              {t('admin.reports.back')}
            </button>
            <button
              type="button"
              aria-busy={isPending || undefined}
              disabled={isPending}
              onClick={handleConfirm}
            >
              {outcome ? t(`admin.reports.confirm.${outcome}`) : null}
            </button>
          </>
        )
      }
    >
      {error ? (
        <div role="alert">
          {reportErrorMessage(error, t)}
          <button type="button" onClick={reset}>
            {t('common.dismiss')}
          </button>
        </div>
      ) : null}

      {outcomes.length === 0 ? (
        <p>{t('admin.reports.noOutcomes')}</p>
      ) : step === 'choose' ? (
        <RadioGroup
          label={t('admin.reports.outcome')}
          name="report-outcome"
          isRequired
          value={outcome}
          options={outcomes.map((value) => ({
            value,
            label: t(`admin.reports.outcomes.${value}`),
            hint: consequence(value),
            icon: OUTCOME_ICONS[value],
          }))}
          onChange={(value) => {
            setOutcome(value as ReportOutcome)
            if (error) reset()
          }}
        />
      ) : outcome ? (
        <div>
          <strong>{t(`admin.reports.outcomes.${outcome}`)}</strong>
          <span>{consequence(outcome)}</span>
          {outcome === 'Dismissed' ? null : (
            <>
              {' '}
              <span>{t('admin.reports.alsoResolves')}</span>
            </>
          )}
        </div>
      ) : null}
    </Dialog>
  )
}
