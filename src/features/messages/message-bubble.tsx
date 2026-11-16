import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { Spinner } from '@/components/spinner/spinner'
import { Tooltip } from '@/components/tooltip/tooltip'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import { linkify } from './linkify'
import { formatFullDate, formatMessageTime } from './message-format'
import { entryDate } from './message-groups'
import styles from './message-list.module.scss'
import type { TimelineEntry } from './message-store'
import type { SendFailure } from './send-failure'
import { canRetry } from './send-failure'

export function MessageContent({ content }: { content: string }) {
  return (
    <>
      {linkify(content).map((part, index) =>
        part.kind === 'link' ? (
          <Link key={index} href={part.href} className={styles.contentLink}>
            {part.text}
          </Link>
        ) : (
          part.text
        ),
      )}
    </>
  )
}

function failureKey(failure: SendFailure | undefined) {
  return `messages.failure.${failure?.kind ?? 'unknown'}` as const
}

export function MessageBubble({
  entry,
  isMine,
  senderName,
  now,
  onRetry,
  onDiscard,
}: {
  entry: TimelineEntry
  isMine: boolean
  senderName: string
  now: number
  onRetry?: (clientMessageId: string) => void
  onDiscard: (clientMessageId: string) => void
}) {
  const { t, i18n } = useTranslation()
  const date = entryDate(entry)
  const time = formatMessageTime(date, i18n.resolvedLanguage)
  const content =
    entry.kind === 'sent' ? entry.message.content : entry.pending.content
  const pending = entry.kind === 'pending' ? entry.pending : null
  const isFailed = pending?.status === 'failed'
  const failure = pending?.failure
  const waitSeconds =
    failure?.kind === 'rateLimited'
      ? Math.max(0, Math.ceil((failure.retryAt - now) / 1000))
      : 0

  return (
    <li
      className={cx(
        styles.message,
        isMine ? styles.mine : styles.theirs,
        pending?.status === 'sending' && styles.sending,
        isFailed && styles.failed,
      )}
    >
      <VisuallyHidden>
        {t('messages.said', {
          name: isMine ? t('messages.you') : senderName,
          time,
        })}
      </VisuallyHidden>
      {/* The time shows on hover, as on Messenger; screen readers hear it
          with the sender above. */}
      <Tooltip
        content={formatFullDate(date, i18n.resolvedLanguage)}
        placement={isMine ? 'left' : 'right'}
      >
        <div className={styles.bubble} dir="auto">
          <MessageContent content={content} />
        </div>
      </Tooltip>
      {pending?.status === 'sending' ? (
        <div className={styles.meta} role="status">
          <Spinner size="sm" tone="muted" isDecorative />
          {t('messages.sending')}
        </div>
      ) : isFailed && pending ? (
        <div className={cx(styles.meta, styles.failure)}>
          <span className={styles.failureText} role="alert">
            <Icon name="alert-circle" size="sm" />
            <span>
              {t('messages.notSent')} {t(failureKey(failure))}
            </span>
          </span>
          <span className={styles.failureActions}>
            {onRetry && failure && canRetry(failure) ? (
              <Button
                size="sm"
                variant="link"
                disabled={waitSeconds > 0}
                onClick={() => onRetry(pending.clientMessageId)}
              >
                {waitSeconds > 0
                  ? t('messages.retryIn', { seconds: waitSeconds })
                  : t('messages.retry')}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="link"
              onClick={() => onDiscard(pending.clientMessageId)}
            >
              {t('messages.discard')}
            </Button>
          </span>
        </div>
      ) : null}
    </li>
  )
}
