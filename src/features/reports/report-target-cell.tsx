import { useTranslation } from 'react-i18next'

import { symbols } from '@/lib/symbols'

import type { AdminReport } from './reports-api'

// The Reported cell of a report row: what it is about (the post text or the
// user's name, sent with the report) above its type and username. Pressing it
// opens the report.
export function ReportTargetCell({
  report,
  onOpen,
}: {
  report: AdminReport
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const type = t(`admin.reports.targetTypes.${report.targetType}`)
  const title = report.post?.content ?? report.user?.displayName
  const username = report.post?.author.username ?? report.user?.username
  const missing = t('admin.reports.all.targetGone')

  return (
    <button
      type="button"
      aria-label={`${t('admin.reports.all.viewDetails')} · ${type} · ${title ?? missing} · ${report.id}`}
      onClick={onOpen}
    >
      <span>
        <span aria-hidden="true">
          {symbols[report.targetType === 'Post' ? 'file-text' : 'user']}
        </span>
      </span>
      <span>
        {title ? <span>{title}</span> : <span>{missing}</span>}
        <span>{username ? `${type} · @${username}` : type}</span>
      </span>
    </button>
  )
}
