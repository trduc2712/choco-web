import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Dialog } from '@/components/dialog/dialog'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Link } from '@/components/link/link'
import { Select } from '@/components/select/select'
import { Spinner } from '@/components/spinner/spinner'
import { Text } from '@/components/text/text'
import { useToast } from '@/components/toast/use-toast'
import { Tooltip } from '@/components/tooltip/tooltip'
import { userProfilePath } from '@/constants/routes'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { LANGUAGE_NAMES } from '@/i18n/languages'
import { ApiError } from '@/lib/api-client'
import { formatRelativeTime } from '@/lib/relative-time'

import type { FeedbackItem } from './feedback-admin-api'
import { FEEDBACK_STATUSES } from './feedback-admin-api'
import styles from './feedback-detail-dialog.module.scss'
import {
  authorName,
  CATEGORY_BADGES,
  describeUserAgent,
  deviceIcon,
  formatDateTime,
  shortVersion,
} from './feedback-format'
import {
  useFeedbackDetail,
  useUpdateFeedbackStatus,
} from './feedback-inbox-api'

type FeedbackDetailDialogProps = {
  // The open feedback's id, or null while the dialog is closed.
  id: string | null
  // The same feedback as the page on screen has it, if it has it.
  listItem: FeedbackItem | undefined
  onClose: () => void
}

function isStatus(value: string): value is (typeof FEEDBACK_STATUSES)[number] {
  return FEEDBACK_STATUSES.some((status) => status === value)
}

// One row of the properties list: an icon and a label on the left, the value
// next to it.
function Property({
  icon,
  label,
  children,
}: {
  icon: IconName
  label: string
  children: ReactNode
}) {
  return (
    <div className={styles.property}>
      <dt className={styles.label}>
        <Icon name={icon} size="sm" />
        {label}
      </dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  )
}

// One feedback. What the person wrote comes first and is the biggest thing in
// the box; the facts about it follow as a list of properties, the status among
// them as the one you can change.
export function FeedbackDetailDialog({
  id,
  listItem,
  onClose,
}: FeedbackDetailDialogProps) {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const { can } = usePermissions()
  // The page on screen has the item most of the time; ask for it only when it
  // does not, so a shared link and a moved-off item still open.
  const detail = useFeedbackDetail(listItem ? null : id)
  const { mutate, isPending } = useUpdateFeedbackStatus()
  const item = listItem ?? detail.data
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
        onError: () =>
          showToast({ tone: 'danger', title: t('admin.feedback.statusError') }),
      },
    )
  }

  const category = item ? CATEGORY_BADGES[item.category] : undefined

  return (
    <Dialog
      isOpen={id !== null}
      onClose={onClose}
      size="lg"
      title={t('admin.feedback.detail.title')}
    >
      {item && category ? (
        <div className={styles.body}>
          <Text className={styles.message}>{item.message}</Text>

          <dl className={styles.properties}>
            <Property
              icon="circle-dot"
              label={t('admin.feedback.detail.status')}
            >
              <Select
                className={styles.status}
                label={t('admin.feedback.detail.status')}
                isLabelHidden
                size="sm"
                value={item.status}
                isDisabled={!canChangeStatus || isPending}
                onChange={(value) => changeStatus(item, value)}
                options={FEEDBACK_STATUSES.map((status) => ({
                  value: status,
                  label: t(`admin.feedback.statuses.${status}`),
                }))}
              />
              {canChangeStatus ? null : (
                <Text size="xs" tone="muted">
                  {t('admin.feedback.detail.readOnly')}
                </Text>
              )}
            </Property>

            <Property icon="tag" label={t('admin.feedback.columns.category')}>
              <Badge icon={category.icon} tone={category.tone}>
                {t(`feedback.categories.${item.category}`)}
              </Badge>
            </Property>

            <Property icon="user" label={t('admin.feedback.columns.from')}>
              {item.author ? (
                <Link to={userProfilePath(item.author.username)}>
                  {authorName(item.author)}
                </Link>
              ) : (
                <Text as="span" tone="muted">
                  {t('admin.feedback.authorDeleted')}
                </Text>
              )}
            </Property>

            <Property
              icon="calendar"
              label={t('admin.feedback.columns.received')}
            >
              <Tooltip
                content={formatRelativeTime(item.createdAt, i18n.language)}
              >
                <time dateTime={item.createdAt} tabIndex={0}>
                  {formatDateTime(item.createdAt, i18n.language)}
                </time>
              </Tooltip>
            </Property>

            <Property icon="globe" label={t('admin.feedback.detail.page')}>
              <span className={styles.mono}>{item.context.path}</span>
            </Property>

            <Property
              icon={deviceIcon(item.context.viewport.width)}
              label={t('admin.feedback.detail.device')}
            >
              <Tooltip content={item.context.userAgent}>
                <span tabIndex={0}>
                  {[
                    describeUserAgent(item.context.userAgent),
                    `${item.context.viewport.width} × ${item.context.viewport.height}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </Tooltip>
            </Property>

            <Property
              icon="languages"
              label={t('admin.feedback.detail.preferences')}
            >
              {`${LANGUAGE_NAMES[item.context.locale]} · ${t(`theme.${item.context.theme}`)}`}
            </Property>

            <Property icon="hash" label={t('admin.feedback.detail.appVersion')}>
              <Tooltip content={item.context.appVersion}>
                <span className={styles.mono} tabIndex={0}>
                  {shortVersion(item.context.appVersion)}
                </span>
              </Tooltip>
            </Property>
          </dl>
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
