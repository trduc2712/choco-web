import { useTranslation } from 'react-i18next'

import type { ReportReason } from './reports-api'

export function ReportReasonBadge({
  reason,
  count,
}: {
  reason: ReportReason
  count?: number
}) {
  const { t } = useTranslation()

  return (
    <span className={`report-reason-badge-${reason}`}>
      {t(`admin.reports.reasons.${reason}`)}
      {count === undefined ? null : ` · ${count}`}
    </span>
  )
}
