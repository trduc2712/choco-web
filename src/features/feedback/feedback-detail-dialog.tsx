import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Link } from '@/components/link/link'
import { SegmentedControl } from '@/components/segmented-control/segmented-control'
import { Spinner } from '@/components/spinner/spinner'
import { Text } from '@/components/text/text'
import { useToast } from '@/components/toast/use-toast'
import { Tooltip } from '@/components/tooltip/tooltip'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { useStoredBoolean } from '@/hooks/use-stored-boolean'
import { LANGUAGE_NAMES } from '@/i18n/languages'
import { ApiError } from '@/lib/api-client'
import { cx } from '@/lib/cx'
import { formatRelativeTime } from '@/lib/relative-time'

import type { FeedbackItem } from './feedback-admin-api'
import { FEEDBACK_STATUSES } from './feedback-admin-api'
import styles from './feedback-detail-dialog.module.scss'
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
  // Where this feedback stands among all the matches, and how to step to the
  // one before or after it. Missing when the feedback is not on the page.
  position?: { current: number; total: number }
  onPrevious?: () => void
  onNext?: () => void
  onClose: () => void
}

// An icon for the theme the sender had on.
const THEME_ICONS: Record<FeedbackItem['context']['theme'], IconName> = {
  light: 'sun',
  dark: 'moon',
  system: 'palette',
}

function isStatus(value: string): value is (typeof FEEDBACK_STATUSES)[number] {
  return FEEDBACK_STATUSES.some((status) => status === value)
}

// One fact about where a feedback came from, as a small chip: an icon, the
// value, and the name of the fact for screen readers.
function Chip({
  icon,
  label,
  children,
  isMono = false,
}: {
  icon: IconName
  label: string
  children: ReactNode
  isMono?: boolean
}) {
  return (
    <span className={cx(styles.chip, isMono && styles.mono)}>
      <Icon name={icon} size="sm" />
      <VisuallyHidden>{label}: </VisuallyHidden>
      {children}
    </span>
  )
}

// One feedback, laid out as a message: who sent it and when, what they wrote in
// a card of its own, the status as four choices you can click, and the facts
// about where it came from kept small underneath.
export function FeedbackDetailDialog({
  id,
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
  const item = detail.data
  const author = item?.author ?? null
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

  const category = item ? CATEGORY_BADGES[item.category] : undefined
  const { browser, browserVersion, system, systemDetail } = userAgentParts(
    item?.context.userAgent ?? '',
  )

  return (
    <Dialog
      isOpen={id !== null}
      onClose={onClose}
      size="lg"
      title={t('admin.feedback.detail.title')}
      headerExtra={
        item && category ? (
          <Badge icon={category.icon} tone={category.tone}>
            {t(`feedback.categories.${item.category}`)}
          </Badge>
        ) : null
      }
      footerAlign="between"
      footer={
        <>
          {author ? (
            <Button
              variant="secondary"
              iconStart="user"
              onClick={() => void navigate(pathOf(author))}
            >
              {t('admin.feedback.detail.openUser')}
            </Button>
          ) : (
            <span />
          )}
          {position ? (
            <div className={styles.position}>
              <Text as="span" size="sm" tone="muted">
                {t('admin.feedback.detail.position', position)}
              </Text>
              <Button
                icon="chevron-left"
                variant="ghost"
                size="sm"
                aria-label={t('admin.feedback.detail.previous')}
                disabled={!onPrevious}
                onClick={onPrevious}
              />
              <Button
                icon="chevron-right"
                variant="ghost"
                size="sm"
                aria-label={t('admin.feedback.detail.next')}
                disabled={!onNext}
                onClick={onNext}
              />
            </div>
          ) : null}
        </>
      }
    >
      {item && category ? (
        <div className={styles.body}>
          <div className={styles.sender}>
            <SenderAvatar author={item.author} />
            <div className={styles.names}>
              {item.author ? (
                <>
                  <Link
                    to={pathOf(item.author)}
                    variant="subtle"
                    className={styles.senderName}
                  >
                    {authorName(item.author)}
                  </Link>
                  <Text size="xs" tone="muted">
                    @{item.author.username}
                  </Text>
                </>
              ) : (
                <Text tone="muted">{t('admin.feedback.authorDeleted')}</Text>
              )}
            </div>
            <div className={styles.when}>
              <Tooltip
                content={formatRelativeTime(item.createdAt, i18n.language)}
              >
                <time dateTime={item.createdAt} tabIndex={0}>
                  {isUtc
                    ? formatDateTimeUtc(item.createdAt, i18n.language)
                    : formatDateTimeZone(item.createdAt, i18n.language)}
                </time>
              </Tooltip>
              <SegmentedControl
                label={t('admin.feedback.detail.timeZone')}
                size="sm"
                value={isUtc ? 'utc' : 'local'}
                onChange={(value) => setIsUtc(value === 'utc')}
                options={[
                  { value: 'local', label: t('admin.feedback.localTime') },
                  { value: 'utc', label: 'UTC' },
                ]}
              />
            </div>
          </div>

          <div className={styles.card}>
            <Text className={styles.message}>{item.message}</Text>
          </div>

          <section className={styles.section}>
            <div className={styles.labelRow}>
              <Text
                as="p"
                size="sm"
                weight="semibold"
                id="feedback-status-label"
              >
                {t('admin.feedback.detail.status')}
              </Text>
              {/* Once out of "new", a feedback cannot go back to it: said once
                  here, for the chip that is chosen and the one that is dimmed. */}
              <Tooltip content={t('admin.feedback.detail.statusHint')}>
                <button
                  type="button"
                  className={styles.hint}
                  aria-label={t('admin.feedback.detail.statusHint')}
                >
                  <Icon name="alert-circle" size="sm" />
                </button>
              </Tooltip>
            </div>
            <div
              className={styles.choices}
              role="radiogroup"
              aria-labelledby="feedback-status-label"
            >
              {FEEDBACK_STATUSES.map((status) => {
                const { icon, tone } = STATUS_BADGES[status]
                const isChosen = item.status === status
                // Once it left "new", it cannot go back.
                const isOut = status === 'new' && item.status !== 'new'
                const label = t(`admin.feedback.statuses.${status}`)
                return (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={isChosen}
                    disabled={!canChangeStatus || isPending || isOut}
                    data-tone={tone}
                    className={styles.choice}
                    onClick={() => changeStatus(item, status)}
                  >
                    <Icon name={icon} size="sm" />
                    {label}
                  </button>
                )
              })}
            </div>
            {canChangeStatus ? null : (
              <Text size="xs" tone="muted">
                {t('admin.feedback.detail.readOnly')}
              </Text>
            )}
          </section>

          <section className={styles.section}>
            <Text as="p" size="sm" weight="semibold">
              {t('admin.feedback.detail.origin')}
            </Text>
            <div className={styles.chips}>
              <Chip
                icon="terminal"
                label={t('admin.feedback.detail.page')}
                isMono
              >
                {item.context.path}
              </Chip>
              {browser ? (
                <Tooltip
                  content={[browser, browserVersion].filter(Boolean).join(' ')}
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
                    <Chip icon="cpu" label={t('admin.feedback.detail.system')}>
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
          </section>
        </div>
      ) : id === null ? null : detail.isPending ? (
        <div className={styles.center}>
          <Spinner label={t('common.loading')} />
        </div>
      ) : (
        <EmptyState
          size="sm"
          role="alert"
          icon="alert-circle"
          title={
            detail.error instanceof ApiError && detail.error.status === 404
              ? t('admin.feedback.detail.notFound')
              : t('admin.feedback.detail.loadError')
          }
        />
      )}
    </Dialog>
  )
}
