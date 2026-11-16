import { useTranslation } from 'react-i18next'

import type { BadgeTone } from '@/components/badge/badge'
import { Badge } from '@/components/badge/badge'

import styles from './report-reason-badge.module.scss'
import type { ReportReason } from './reports-api'

const reasonTones: Record<ReportReason, BadgeTone> = {
  Spam: 'info',
  Harassment: 'warning',
  HateSpeech: 'neutral',
  Violence: 'danger',
  Other: 'neutral',
}

export function ReportReasonBadge({
  reason,
  count,
}: {
  reason: ReportReason
  count?: number
}) {
  const { t } = useTranslation()

  return (
    <Badge tone={reasonTones[reason]} className={styles[reason]}>
      {t(`admin.reports.reasons.${reason}`)}
      {count === undefined ? null : ` · ${count}`}
    </Badge>
  )
}
