import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Skeleton } from '@/components/skeleton/skeleton'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

import type { AuditEntry } from '../audit-log-api'
import type { AuditTimeZone } from '../audit-log-dates'
import type { DayGroup } from '../audit-log-format'
import {
  actionLabel,
  actionMeta,
  actionTally,
  badgeLabel,
  describeEntry,
  feedbackStatus,
  formatTime,
  shortId,
  targetLabel,
  targetPlacement,
} from '../audit-log-format'
import type { EntryFilter } from '../audit-parts'
import { EntrySentence } from '../audit-parts'
import { AuditRecord, AuditTargetChip } from '../audit-record'

const BADGED_ACTIONS = new Set([
  'RoleAssigned',
  'RoleRevoked',
  'AccessDenied',
  'PostReported',
  'UserReported',
  'ReportResolved',
  'UserSuspended',
])

// Entries that happen all the time and change nothing; they step back so the
// rest stand out.
const ROUTINE_ACTIONS = new Set(['AuditLogRead'])

// The day's summary shows this many kinds of action, then "+n".
const TALLY_LIMIT = 4

// The weekday and day of the month of a "YYYY-MM-DD" day, for the date tile.
function dayParts(key: string, language: string) {
  const date = new Date(`${key}T00:00:00Z`)
  return {
    weekday: new Intl.DateTimeFormat(language, {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(date),
    day: new Intl.DateTimeFormat(language, {
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date),
  }
}

// "21:58:46" with the seconds quieter, so the minutes are what the eye reads.
function Clock({ time }: { time: string }) {
  return (
    <>
      {time.slice(0, 5)}
      <span>{time.slice(5)}</span>
    </>
  )
}

function DayHeader({ group }: { group: DayGroup }) {
  const { t, i18n } = useTranslation()
  const { weekday, day } = dayParts(group.key, i18n.language)
  const tally = actionTally(group.entries)
  const shown = tally.slice(0, TALLY_LIMIT)
  const rest = tally
    .slice(TALLY_LIMIT)
    .reduce((sum, kind) => sum + kind.count, 0)

  return (
    <div>
      <span aria-hidden="true">
        <span>{weekday}</span>
        <span>{day}</span>
      </span>
      <div>
        <Heading level={2} size="md">
          {group.label}
        </Heading>
        <span>
          {group.dateLabel !== group.label ? (
            <>
              <time dateTime={group.key}>{group.dateLabel}</time>
              <span aria-hidden="true"> · </span>
            </>
          ) : null}
          {t('admin.auditLog.entryCount', { count: group.entries.length })}
        </span>
      </div>
      <ul aria-label={t('admin.auditLog.daySummary')}>
        {shown.map(({ action, count }) => (
          <li
            key={action}
            data-tone={actionMeta(action).tone}
            title={actionLabel(action, t)}
          >
            <Icon name={actionMeta(action).icon} size="sm" />
            <VisuallyHidden>{actionLabel(action, t)}:</VisuallyHidden>
            {count}
          </li>
        ))}
        {rest > 0 ? <li data-tone="neutral">+{rest}</li> : null}
      </ul>
    </div>
  )
}

type TimelineProps = {
  groups: DayGroup[]
  zone: AuditTimeZone
  selectedId: string | null
  onSelect: (id: string | null) => void
  onFilter: (kind: EntryFilter, entry: AuditEntry) => void
  canBrowsePosts: boolean
}

export function TimelineView({
  groups,
  zone,
  selectedId,
  onSelect,
  onFilter,
  canBrowsePosts,
}: TimelineProps) {
  const { t } = useTranslation()

  return (
    <div>
      {groups.map((group) => (
        <section key={group.key}>
          <DayHeader group={group} />
          <div>
            <ol>
              {group.entries.map((entry) => {
                const status = feedbackStatus(entry)
                const meta = actionMeta(entry.action)
                const tone =
                  status === 'resolved'
                    ? 'success'
                    : status === 'wont_fix'
                      ? 'neutral'
                      : meta.tone
                const icon = status === 'resolved' ? 'check-circle' : meta.icon
                const isOpen = selectedId === entry.id
                const placement = targetPlacement(entry)
                const targetChip = (
                  <AuditTargetChip
                    entry={entry}
                    className={
                      placement === 'apart' ? 'timeline-view-target' : undefined
                    }
                    isOpen={isOpen}
                    onToggle={() => onSelect(isOpen ? null : entry.id)}
                  />
                )
                return (
                  <li
                    key={entry.id}
                    data-tone={tone}
                    data-routine={
                      ROUTINE_ACTIONS.has(entry.action) || undefined
                    }
                  >
                    <time dateTime={entry.occurredAt}>
                      <Clock time={formatTime(entry.occurredAt, true, zone)} />
                    </time>
                    <span>
                      <Icon name={icon} size="sm" />
                    </span>
                    <div data-open={isOpen}>
                      {/* The whole line opens the entry: the toggle at its end
                          stretches over it, and the name links sit above. */}
                      <div>
                        <span>
                          <strong>
                            <EntrySentence
                              entry={entry}
                              target={
                                placement === 'sentence'
                                  ? targetChip
                                  : undefined
                              }
                            />
                          </strong>
                          {placement === 'apart' ? targetChip : null}
                        </span>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label={describeEntry(entry, t, {
                            target: `${targetLabel(entry.targetType, t)} ${shortId(entry.targetId)}`,
                          })}
                          onClick={() => onSelect(isOpen ? null : entry.id)}
                        >
                          <Icon name="chevron-down" size="sm" />
                        </button>
                      </div>
                      {isOpen ? (
                        <div>
                          {/* What the action came to; the line's sentence
                              already says it, so it waits for the opened entry. */}
                          {BADGED_ACTIONS.has(entry.action) ? (
                            <Badge tone={tone === 'purple' ? 'primary' : tone}>
                              {badgeLabel(entry.action, t)}
                            </Badge>
                          ) : null}
                          <AuditRecord
                            entry={entry}
                            onFilter={onFilter}
                            canBrowsePosts={canBrowsePosts}
                            zone={zone}
                          />
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>
      ))}
    </div>
  )
}

export function TimelineSkeleton() {
  return (
    <div aria-busy="true">
      <div>
        <div>
          <span>
            <Skeleton width="100%" height="100%" />
          </span>
          <div>
            <Skeleton width="var(--size-time-input)" lines={2} />
          </div>
        </div>
        <div>
          <div>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index}>
                <span>
                  <Skeleton />
                </span>
                <span>
                  <Skeleton width="100%" height="100%" />
                </span>
                <div>
                  <span>
                    <span>
                      <Skeleton lines={2} />
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
