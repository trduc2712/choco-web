import { useTranslation } from 'react-i18next'

import { Tooltip } from '@/components/tooltip/tooltip'
import { cx } from '@/lib/cx'

import { linkify } from './linkify'
import { formatFullDate, formatMessageTime } from './message-format'
import { entryDate } from './message-groups'
import type { TimelineEntry } from './message-store'
import type { SendFailure } from './send-failure'
import { canRetry } from './send-failure'

export function MessageContent({ content }: { content: string }) {
  return (
    <>
      {linkify(content).map((part, index) =>
        part.kind === 'link' ? (
          <a
            target="_blank"
            rel="noopener noreferrer"
            key={index}
            href={part.href}
          >
            {part.text}
          </a>
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
        'message-list-message',
        isMine ? 'message-list-mine' : 'message-list-theirs',
        pending?.status === 'sending' && 'message-list-sending',
        isFailed && 'message-list-failed',
      )}
    >
      <p>
        {t('messages.said', {
          name: isMine ? t('messages.you') : senderName,
          time,
        })}
      </p>
      {/* The time shows on hover, as on Messenger; screen readers hear it
          with the sender above. */}
      <Tooltip
        content={formatFullDate(date, i18n.resolvedLanguage)}
        placement={isMine ? 'left' : 'right'}
      >
        <div dir="auto">
          <MessageContent content={content} />
        </div>
      </Tooltip>
      {pending?.status === 'sending' ? (
        <div role="status">
          <span aria-hidden="true">&hellip;</span>
          {t('messages.sending')}
        </div>
      ) : isFailed && pending ? (
        <div className={cx('message-list-meta', 'message-list-failure')}>
          <span role="alert">
            <span aria-hidden="true">!</span>
            <span>
              {t('messages.notSent')} {t(failureKey(failure))}
            </span>
          </span>
          <span>
            {onRetry && failure && canRetry(failure) ? (
              <button
                type="button"
                disabled={waitSeconds > 0}
                onClick={() => onRetry(pending.clientMessageId)}
              >
                {waitSeconds > 0
                  ? t('messages.retryIn', { seconds: waitSeconds })
                  : t('messages.retry')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDiscard(pending.clientMessageId)}
            >
              {t('messages.discard')}
            </button>
          </span>
        </div>
      ) : null}
    </li>
  )
}
