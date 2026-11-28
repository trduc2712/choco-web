import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'
import { useNavigate } from 'react-router'

import { Dialog } from '@/components/dialog/dialog'
import { SegmentedControl } from '@/components/segmented-control/segmented-control'
import { useToast } from '@/components/toast/use-toast'
import { Tooltip } from '@/components/tooltip/tooltip'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { useStoredBoolean } from '@/hooks/use-stored-boolean'
import { LANGUAGE_NAMES } from '@/i18n/languages'
import { ApiError } from '@/lib/api-client'
import { cx } from '@/lib/cx'
import { formatRelativeTime } from '@/lib/relative-time'
import type { SymbolName } from '@/lib/symbols'
import { symbols } from '@/lib/symbols'

import type { FeedbackItem, FeedbackSummary } from './feedback-admin-api'
import { FEEDBACK_STATUSES } from './feedback-admin-api'
import {
  authorName,
  CATEGORY_BADGES,
  deviceIcon,
  formatDateTimeUtc,
  formatDateTimeZone,
  shortVersion,
  STATUS_BADGES,
  userAgentParts,
} from './feedback-format'
import {
  useFeedbackDetail,
  useUpdateFeedbackStatus,
} from './feedback-inbox-api'
import { SenderAvatar } from './feedback-sender-avatar'
import { useAuthorPath } from './use-author-path'

type FeedbackDetailDialogProps = {
  // The open feedback's id, or null while the dialog is closed.
  id: string | null
  previewSkeleton?: boolean
  summary?: FeedbackSummary
  // Where this feedback stands among all the matches, and how to step to the
  // one before or after it. Missing when the feedback is not on the page.
  position?: { current: number; total: number }
  onPrevious?: () => void
  onNext?: () => void
  onClose: () => void
}

// An icon for the theme the sender had on.
const THEME_ICONS: Record<FeedbackItem['context']['theme'], SymbolName> = {
  light: 'sun',
  dark: 'moon',
  system: 'palette',
}

function isStatus(value: string): value is (typeof FEEDBACK_STATUSES)[number] {
  return FEEDBACK_STATUSES.some((status) => status === value)
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" inert>
      <div>{children}</div>
      <span aria-hidden="true">&hellip;</span>
    </div>
  )
}

// One fact about where a feedback came from, as a small chip: an icon, the
// value, and the name of the fact for screen readers.
function Chip({
  icon,
  label,
  children,
  isMono = false,
}: {
  icon: SymbolName
  label: string
  children: ReactNode
  isMono?: boolean
}) {
  return (
    <span
      className={cx(
        'feedback-detail-dialog-chip',
        isMono && 'feedback-detail-dialog-mono',
      )}
    >
      <span aria-hidden="true">{symbols[icon]}</span>
      <span className="visually-hidden">{label}: </span>
      {children}
    </span>
  )
}

// One feedback, laid out as a message: who sent it and when, what they wrote in
// a card of its own, the status as four choices you can click, and the facts
// about where it came from kept small underneath.
export function FeedbackDetailDialog({
  id,
  previewSkeleton = false,
  summary,
  position,
  onPrevious,
  onNext,
  onClose,
}: FeedbackDetailDialogProps) {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const { pathOf } = useAuthorPath()
  // Which clock the time is read on; remembered between visits.
  const [isUtc, setIsUtc] = useStoredBoolean('choco.admin.feedback.utc', false)
  // The list only has previews, so the whole feedback is loaded by id.
  const detail = useFeedbackDetail(id)
  const { mutate, isPending } = useUpdateFeedbackStatus()
  const item = previewSkeleton ? undefined : detail.data
  const isLoading = id !== null && (previewSkeleton || detail.isPending)
  const feedback =
    item ?? (isLoading && summary?.id === id ? summary : undefined)
  const author = feedback?.author ?? null
  const canChangeStatus = can(PERMISSIONS.changeFeedbackStatus)

  function changeStatus(target: FeedbackItem, value: string) {
    if (!isStatus(value) || value === target.status) return
    mutate(
      { id: target.id, status: value },
      {
        onSuccess: () =>
          showToast({
            tone: 'success',
            title: t('admin.feedback.statusUpdated'),
          }),
        // 409: the feedback already left "new". The item loads again, so the
        // dialog shows the status the server has.
        onError: (error) =>
          showToast({
            tone: 'danger',
            title: t(
              error instanceof ApiError && error.status === 409
                ? 'admin.feedback.cannotReturnToNew'
                : 'admin.feedback.statusError',
            ),
          }),
      },
    )
  }

  const category = feedback ? CATEGORY_BADGES[feedback.category] : undefined
  const categoryBadge = feedback && category && (
    <span>{t(`feedback.categories.${feedback.category}`)}</span>
  )
  const openUser = (
    <button
      type="button"
      onClick={() => author && void navigate(pathOf(author))}
    >
      {t('admin.feedback.detail.openUser')}
    </button>
  )
  const { browser, browserVersion, system, systemDetail } = userAgentParts(
    item?.context.userAgent ?? '',
  )
  const timeZone = (
    <SegmentedControl
      label={t('admin.feedback.detail.timeZone')}
      value={isUtc ? 'utc' : 'local'}
      onChange={(value) => setIsUtc(value === 'utc')}
      options={[
        { value: 'local', label: t('admin.feedback.localTime') },
        { value: 'utc', label: 'UTC' },
      ]}
    />
  )

  return (
    <Dialog
      isOpen={id !== null}
      onClose={onClose}
      title={t('admin.feedback.detail.title')}
      headerExtra={
        isLoading ? (
          <Placeholder>
            {categoryBadge || (
              <span>{t('admin.feedback.columns.category')}</span>
            )}
          </Placeholder>
        ) : (
          categoryBadge
        )
      }
      footer={
        <>
          {isLoading && (author || !feedback) ? (
            <Placeholder>{openUser}</Placeholder>
          ) : author ? (
            openUser
          ) : (
            <span />
          )}
          {position ? (
            <div>
              <span>{t('admin.feedback.detail.position', position)}</span>
              <button
                type="button"
                aria-label={t('admin.feedback.detail.previous')}
                disabled={!onPrevious}
                onClick={onPrevious}
              >
                {t('admin.feedback.detail.previous')}
              </button>
              <button
                type="button"
                aria-label={t('admin.feedback.detail.next')}
                disabled={!onNext}
                onClick={onNext}
              >
                {t('admin.feedback.detail.next')}
              </button>
            </div>
          ) : null}
        </>
      }
    >
      {item || isLoading ? (
        <div aria-busy={isLoading || undefined}>
          {isLoading && (
            <span className="visually-hidden" role="status">
              {t('common.loading')}
            </span>
          )}
          <div>
            {isLoading ? (
              <span aria-hidden="true">&hellip;</span>
            ) : (
              <SenderAvatar author={author} />
            )}
            <div>
              {isLoading ? (
                <Placeholder>
                  {author || !feedback ? (
                    <>
                      <p>
                        {author
                          ? authorName(author)
                          : t('admin.feedback.columns.from')}
                      </p>
                      <p>@{author?.username ?? 'username'}</p>
                    </>
                  ) : (
                    <p>{t('admin.feedback.authorDeleted')}</p>
                  )}
                </Placeholder>
              ) : author ? (
                <>
                  <RouterLink to={pathOf(author)}>
                    {authorName(author)}
                  </RouterLink>
                  <p>@{author.username}</p>
                </>
              ) : (
                <p>{t('admin.feedback.authorDeleted')}</p>
              )}
            </div>
            <div>
              {isLoading ? (
                <Placeholder>
                  {feedback
                    ? isUtc
                      ? formatDateTimeUtc(feedback.createdAt, i18n.language)
                      : formatDateTimeZone(feedback.createdAt, i18n.language)
                    : t('admin.feedback.columns.received')}
                </Placeholder>
              ) : (
                item && (
                  <Tooltip
                    content={formatRelativeTime(item.createdAt, i18n.language)}
                  >
                    <time dateTime={item.createdAt} tabIndex={0}>
                      {isUtc
                        ? formatDateTimeUtc(item.createdAt, i18n.language)
                        : formatDateTimeZone(item.createdAt, i18n.language)}
                    </time>
                  </Tooltip>
                )
              )}
              {isLoading ? <Placeholder>{timeZone}</Placeholder> : timeZone}
            </div>
          </div>

          <div>
            {isLoading ? (
              <Placeholder>
                <p>
                  {summary?.id === id
                    ? summary?.messagePreview
                    : t('common.loading')}
                </p>
              </Placeholder>
            ) : (
              <p>{item?.message}</p>
            )}
          </div>

          <section>
            <div>
              <p id="feedback-status-label">
                {t('admin.feedback.detail.status')}
              </p>
              {/* Once out of "new", a feedback cannot go back to it: said once
                  here, for the chip that is chosen and the one that is dimmed. */}
              <Tooltip content={t('admin.feedback.detail.statusHint')}>
                <button
                  type="button"
                  aria-label={t('admin.feedback.detail.statusHint')}
                >
                  <span aria-hidden="true">!</span>
                </button>
              </Tooltip>
            </div>
            <div role="radiogroup" aria-labelledby="feedback-status-label">
              {FEEDBACK_STATUSES.map((status) => {
                const { icon, tone } = STATUS_BADGES[status]
                const isChosen = feedback?.status === status
                // Once it left "new", it cannot go back.
                const isOut = status === 'new' && item?.status !== 'new'
                const label = t(`admin.feedback.statuses.${status}`)
                if (isLoading) {
                  return (
                    <Placeholder key={status}>
                      <span aria-checked={isChosen}>
                        <span aria-hidden="true">{symbols[icon]}</span>
                        {label}
                      </span>
                    </Placeholder>
                  )
                }
                return (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={isChosen}
                    disabled={!canChangeStatus || isPending || isOut}
                    data-tone={tone}
                    onClick={() => item && changeStatus(item, status)}
                  >
                    <span aria-hidden="true">{symbols[icon]}</span>
                    {label}
                  </button>
                )
              })}
            </div>
            {canChangeStatus ? null : (
              <p>{t('admin.feedback.detail.readOnly')}</p>
            )}
          </section>

          <section>
            <p>{t('admin.feedback.detail.origin')}</p>
            {item ? (
              <div>
                <Chip
                  icon="terminal"
                  label={t('admin.feedback.detail.page')}
                  isMono
                >
                  {item.context.path}
                </Chip>
                {browser ? (
                  <Tooltip
                    content={[browser, browserVersion]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span tabIndex={0}>
                      <Chip
                        icon="globe"
                        label={t('admin.feedback.detail.browser')}
                      >
                        {browser}
                      </Chip>
                    </span>
                  </Tooltip>
                ) : null}
                {system ? (
                  <Tooltip content={systemDetail ?? system}>
                    <span tabIndex={0}>
                      <Chip
                        icon="cpu"
                        label={t('admin.feedback.detail.system')}
                      >
                        {system}
                      </Chip>
                    </span>
                  </Tooltip>
                ) : null}
                <Chip
                  icon={deviceIcon(item.context.viewport.width)}
                  label={t('admin.feedback.detail.screen')}
                >
                  {`${item.context.viewport.width} × ${item.context.viewport.height}`}
                </Chip>
                <Chip
                  icon="languages"
                  label={t('admin.feedback.detail.language')}
                >
                  {LANGUAGE_NAMES[item.context.locale]}
                </Chip>
                <Chip
                  icon={THEME_ICONS[item.context.theme]}
                  label={t('admin.feedback.detail.theme')}
                >
                  {t(`theme.${item.context.theme}`)}
                </Chip>
                <Tooltip content={item.context.appVersion}>
                  <span tabIndex={0}>
                    <Chip
                      icon="hash"
                      label={t('admin.feedback.detail.appVersion')}
                      isMono
                    >
                      {shortVersion(item.context.appVersion)}
                    </Chip>
                  </span>
                </Tooltip>
              </div>
            ) : (
              <div>
                {(
                  [
                    'page',
                    'browser',
                    'system',
                    'screen',
                    'language',
                    'theme',
                    'appVersion',
                  ] as const
                ).map((field) => (
                  <Placeholder key={field}>
                    <span>
                      <span aria-hidden="true">❯</span>
                      {t(`admin.feedback.detail.${field}`)}
                    </span>
                  </Placeholder>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : id === null ? null : (
        <section role="alert">
          <h2>
            {detail.error instanceof ApiError && detail.error.status === 404
              ? t('admin.feedback.detail.notFound')
              : t('admin.feedback.detail.loadError')}
          </h2>
        </section>
      )}
    </Dialog>
  )
}
