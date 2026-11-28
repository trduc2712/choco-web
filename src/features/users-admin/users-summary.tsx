import { useTranslation } from 'react-i18next'

import { type AdminUserState, useAdminUsers } from './users-admin-api'

type UsersSummaryProps = {
  state?: AdminUserState
  // Absent on the placeholder, which fetches nothing and cannot be used.
  onSelect?: (state: AdminUserState | null) => void
  isPlaceholder?: boolean
}

const countPage = { page: 1, pageSize: 1 }

export function UsersSummary({
  state,
  onSelect,
  isPlaceholder = false,
}: UsersSummaryProps) {
  const { t, i18n } = useTranslation()
  const current = useAdminUsers(countPage, !isPlaceholder)
  const active = useAdminUsers(
    { ...countPage, state: 'active' },
    !isPlaceholder,
  )
  const suspended = useAdminUsers(
    { ...countPage, state: 'suspended' },
    !isPlaceholder,
  )
  const deleted = useAdminUsers(
    { ...countPage, state: 'deleted' },
    !isPlaceholder,
  )
  const total = current.data?.totalCount
  const numbers = new Intl.NumberFormat(i18n.language)
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 1,
  })

  const metrics = [
    { state: null, label: t('admin.users.summary.current'), query: current },
    { state: 'active', label: t('admin.users.states.active'), query: active },
    {
      state: 'suspended',
      label: t('admin.users.states.suspended'),
      query: suspended,
    },
    {
      state: 'deleted',
      label: t('admin.users.states.deleted'),
      query: deleted,
    },
  ] as const

  return (
    <div
      role={isPlaceholder ? undefined : 'group'}
      aria-label={isPlaceholder ? undefined : t('admin.users.columns.state')}
      aria-hidden={isPlaceholder || undefined}
      inert={isPlaceholder}
    >
      {metrics.map((metric) => {
        const count = metric.query.data?.totalCount
        const share =
          total &&
          count !== undefined &&
          (metric.state === 'active' || metric.state === 'suspended')
            ? t('admin.users.summary.share', {
                percent: percent.format(count / total),
              })
            : undefined
        // A share still on its way takes the room of a typical one, so the
        // card does not change height when it wraps onto a second line.
        const isSharePending =
          (metric.state === 'active' || metric.state === 'suspended') &&
          (isPlaceholder || current.isPending || metric.query.isPending)

        return (
          <button
            key={metric.state ?? 'current'}
            type="button"
            data-state={metric.state ?? 'current'}
            aria-pressed={(state ?? null) === metric.state}
            onClick={() => onSelect?.(metric.state)}
          >
            <span>{metric.label}</span>
            <span>
              {count !== undefined ? (
                numbers.format(count)
              ) : metric.query.isPending ? (
                <span aria-hidden="true">&hellip;</span>
              ) : (
                '—'
              )}
            </span>
            <span>
              {isSharePending ? (
                <span aria-hidden="true">
                  {t('admin.users.summary.share', {
                    percent: percent.format(0.555),
                  })}
                </span>
              ) : (
                (share ??
                t(
                  metric.state === null
                    ? 'admin.users.summary.currentHint'
                    : metric.state === 'deleted'
                      ? 'admin.users.summary.deletedHint'
                      : 'admin.users.summary.users',
                ))
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
