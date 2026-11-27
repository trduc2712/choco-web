import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { Divider } from '@/components/divider/divider'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Spinner } from '@/components/spinner/spinner'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import { MessageBubble } from './message-bubble'
import { formatDayLabel, formatMessageTime } from './message-format'
import { entrySenderIsMine, groupEntries } from './message-groups'
import type { Timeline, TimelineEntry } from './message-store'
import {
  contiguousSequence,
  newestSequence,
  timelineEntries,
} from './message-store'
import { useNow, usePageAttention } from './use-page-attention'

// Closer than this to the end counts as reading the newest message.
const BOTTOM_THRESHOLD_PX = 48
// Older history starts loading this far before the top is reached.
const TOP_THRESHOLD_PX = 400
const MARK_READ_DELAY_MS = 500

function incomingSequence(entry: TimelineEntry, viewerId: string) {
  return entry.kind === 'sent' && entry.message.senderId !== viewerId
    ? entry.message.sequence
    : null
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const skeletonRuns = [
  { side: 'theirs', widths: ['var(--size-measure-sm)', 'var(--space-9)'] },
  { side: 'mine', widths: ['var(--space-8)'] },
  { side: 'theirs', widths: ['var(--space-9)'] },
  { side: 'mine', widths: ['calc(2 * var(--space-9))', 'var(--space-9)'] },
  { side: 'theirs', widths: ['var(--space-7)'] },
  { side: 'mine', widths: ['calc(2 * var(--space-8))'] },
] as const

export function MessageListSkeleton() {
  const { t } = useTranslation()
  return (
    <div role="status">
      <VisuallyHidden>{t('messages.loading')}</VisuallyHidden>
      <div aria-hidden="true">
        <div>
          <div className={cx('message-list-day', 'message-list-skeletonDay')}>
            <Skeleton width="var(--space-7)" />
            {skeletonRuns.map(({ side, widths }) => (
              <div key={widths[0]}>
                {side === 'theirs' ? (
                  <Skeleton
                    shape="circle"
                    width="var(--size-avatar-xs)"
                    height="var(--size-avatar-xs)"
                  />
                ) : null}
                <div
                  className={cx(
                    'message-list-run',
                    side === 'mine'
                      ? 'message-list-runMine'
                      : 'message-list-runTheirs',
                  )}
                >
                  {widths.map((width) => (
                    <div
                      className={cx(
                        'message-list-message',
                        `message-list-${side}`,
                      )}
                      key={width}
                      style={{ inlineSize: width }}
                    >
                      <Skeleton
                        shape="rect"
                        className={cx(
                          'message-list-bubble',
                          'message-list-skeletonBubble',
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MessageList({
  timeline,
  viewerId,
  otherName,
  otherAvatarUrl,
  older,
  onLoadOlder,
  onRetry,
  onDiscard,
  onMarkRead,
}: {
  timeline: Timeline
  viewerId: string
  otherName: string
  otherAvatarUrl?: string
  older: { isLoading: boolean; isError: boolean }
  onLoadOlder: () => void
  onRetry?: (clientMessageId: string) => void
  onDiscard: (clientMessageId: string) => void
  onMarkRead: (conversationId: string, sequence: number) => void
}) {
  const { t, i18n } = useTranslation()
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const entries = useMemo(
    () => timelineEntries(timeline, viewerId),
    [timeline, viewerId],
  )
  const newest = newestSequence(timeline)
  const hasAttention = usePageAttention()

  // Fixed when the conversation opens, so it stays put as messages are read.
  const [dividerKey] = useState(
    () =>
      entries.find((entry) => {
        const sequence = incomingSequence(entry, viewerId)
        return sequence !== null && sequence > timeline.lastReadSequence
      })?.key,
  )
  // Messages newer than this arrived while the conversation was open.
  const [openedAt] = useState(newest)
  const [isAtBottom, setIsAtBottom] = useState(true)
  // The newest sequence that has been on screen at the bottom of the list.
  const [seenThrough, setSeenThrough] = useState(newest)

  const atBottomRef = useRef(true)
  const metrics = useRef({ scrollHeight: 0, scrollTop: 0 })
  const previous = useRef<{ first?: string; last?: string } | null>(null)

  const days = useMemo(
    () => groupEntries(entries, viewerId, dividerKey),
    [entries, viewerId, dividerKey],
  )
  const unseen = isAtBottom
    ? 0
    : entries.filter((entry) => {
        const sequence = incomingSequence(entry, viewerId)
        return sequence !== null && sequence > seenThrough
      }).length
  const latestIncoming = entries.findLast((entry) => {
    const sequence = incomingSequence(entry, viewerId)
    return sequence !== null && sequence > openedAt
  })
  const hasCountdown = entries.some(
    (entry) =>
      entry.kind === 'pending' && entry.pending.failure?.kind === 'rateLimited',
  )
  const now = useNow(hasCountdown)
  const hasOlder = timeline.olderCursor !== null

  function measure() {
    const element = scrollerRef.current
    if (!element) return
    metrics.current = {
      scrollHeight: element.scrollHeight,
      scrollTop: element.scrollTop,
    }
  }

  function scrollToBottom(behavior: ScrollBehavior = 'auto') {
    const element = scrollerRef.current
    element?.scrollTo({ top: element.scrollHeight, behavior })
  }

  // Opens at the newest message; keeps the reading position when older pages
  // are added on top; follows new messages only when already at the bottom
  // (or when the viewer just sent one).
  useLayoutEffect(() => {
    const element = scrollerRef.current
    if (!element) return
    const first = entries[0]?.key
    const lastEntry = entries.at(-1)
    const last = lastEntry?.key
    const before = previous.current
    previous.current = { first, last }

    if (!before) {
      element.scrollTop = element.scrollHeight
    } else {
      const isPrepended =
        before.first !== undefined &&
        first !== before.first &&
        entries.some((entry) => entry.key === before.first)
      if (isPrepended) {
        element.scrollTop =
          metrics.current.scrollTop +
          (element.scrollHeight - metrics.current.scrollHeight)
      }
      const isOwnNew = last !== before.last && lastEntry?.kind === 'pending'
      if (atBottomRef.current || isOwnNew) {
        element.scrollTop = element.scrollHeight
      }
    }
    measure()

    // Too little history to scroll: fetch more until there is.
    if (
      hasOlder &&
      !older.isLoading &&
      !older.isError &&
      element.scrollHeight <= element.clientHeight + TOP_THRESHOLD_PX
    ) {
      onLoadOlder()
    }
  }, [entries, hasOlder, older.isLoading, older.isError, onLoadOlder])

  // Marks read once the newest message is on screen in a focused tab.
  const conversationId = timeline.conversationId
  const lastRead = timeline.lastReadSequence
  const readThrough = contiguousSequence(timeline)
  useEffect(() => {
    if (
      !conversationId ||
      !isAtBottom ||
      !hasAttention ||
      readThrough <= lastRead
    ) {
      return
    }
    const timer = setTimeout(
      () => onMarkRead(conversationId, readThrough),
      MARK_READ_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [
    conversationId,
    isAtBottom,
    hasAttention,
    readThrough,
    lastRead,
    onMarkRead,
  ])

  function handleScroll() {
    const element = scrollerRef.current
    if (!element) return
    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight
    const atBottom = distance <= BOTTOM_THRESHOLD_PX
    atBottomRef.current = atBottom
    setIsAtBottom(atBottom)
    if (atBottom) setSeenThrough(newest)
    measure()
    if (
      element.scrollTop <= TOP_THRESHOLD_PX &&
      hasOlder &&
      !older.isLoading &&
      !older.isError
    ) {
      onLoadOlder()
    }
  }

  function jumpToLatest() {
    scrollToBottom(prefersReducedMotion() ? 'auto' : 'smooth')
    // The button goes away at the bottom; keep focus in the conversation.
    scrollerRef.current?.focus({ preventScroll: true })
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        className="message-list-scroller"
        tabIndex={0}
        role="region"
        aria-label={t('messages.historyLabel', { name: otherName })}
        onScroll={handleScroll}
      >
        <div>
          {hasOlder ? (
            <div>
              {older.isError ? (
                <>
                  <Text size="xs" tone="danger" role="alert">
                    {t('messages.olderError')}
                  </Text>
                  <Button size="sm" variant="secondary" onClick={onLoadOlder}>
                    {t('common.retry')}
                  </Button>
                </>
              ) : (
                <Spinner size="sm" label={t('messages.loadingOlder')} />
              )}
            </div>
          ) : entries.length > 0 ? (
            <Text size="xs" tone="muted" align="center">
              {t('messages.beginning', { name: otherName })}
            </Text>
          ) : null}

          {days.map((day) => (
            <div key={day.key}>
              <Divider
                label={formatDayLabel(day.date, i18n.resolvedLanguage, t)}
              />
              {day.runs.map((run) => (
                <div key={run.key}>
                  {run.showsTime ? (
                    <Text as="div" size="xs" tone="muted" align="center">
                      {formatMessageTime(run.date, i18n.resolvedLanguage)}
                    </Text>
                  ) : null}
                  {run.key === dividerKey ? (
                    <Divider
                      className={cx(
                        'message-list-dayLabel',
                        'message-list-unreadDivider',
                      )}
                      label={t('messages.newMessages')}
                    />
                  ) : null}
                  <div>
                    {run.isMine ? null : (
                      <span aria-hidden="true">
                        <Avatar
                          name={otherName}
                          src={otherAvatarUrl}
                          fallback="person"
                          size="xs"
                          shape="circle"
                        />
                      </span>
                    )}
                    <ol
                      className={cx(
                        'message-list-run',
                        run.isMine
                          ? 'message-list-runMine'
                          : 'message-list-runTheirs',
                      )}
                    >
                      {run.entries.map((entry) => (
                        <MessageBubble
                          key={entry.key}
                          entry={entry}
                          isMine={entrySenderIsMine(entry, viewerId)}
                          senderName={otherName}
                          now={now}
                          onRetry={onRetry}
                          onDiscard={onDiscard}
                        />
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {unseen > 0 ? (
        <div>
          <Button
            size="sm"
            variant="secondary"
            shape="pill"
            iconStart="arrow-down"
            onClick={jumpToLatest}
          >
            {t('messages.jumpToLatest', { count: unseen })}
          </Button>
        </div>
      ) : null}

      <VisuallyHidden aria-live="polite" aria-atomic="true">
        {latestIncoming?.kind === 'sent'
          ? t('messages.announce', {
              name: otherName,
              text: latestIncoming.message.content,
            })
          : ''}
      </VisuallyHidden>
    </div>
  )
}
