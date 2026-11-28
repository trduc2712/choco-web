import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { useToast } from '@/components/toast/use-toast'
import { MESSAGES_PATH, userProfilePath } from '@/constants/routes'
import { useSuspension } from '@/features/current-user'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'

import type { ComposerClosed } from './composer'
import { Composer, ComposerSkeleton } from './composer'
import { ConversationInfo } from './conversation-info'
import { displayName } from './message-format'
import { MessageList, MessageListSkeleton } from './message-list'
import type { Timeline } from './message-store'
import { useConnectionStatus, useMessaging } from './messaging-context'
import type { MessagingUser } from './messaging-types'
import { isPermanentFailure } from './send-failure'
import {
  useConversationActions,
  useInbox,
  useMessagingUser,
  useOlderMessages,
  useTimeline,
} from './use-messages'
import { useNow } from './use-page-attention'

function BackLink() {
  const { t } = useTranslation()
  return (
    <RouterLink to={MESSAGES_PATH} aria-label={t('messages.back')}>
      <span aria-hidden="true">←</span>
    </RouterLink>
  )
}

export function ConversationSkeleton() {
  const { t } = useTranslation()
  return <span role="status">{t('messages.loading')}</span>
}

function ConversationHeader({
  user,
  infoId,
  isInfoOpen,
  onToggleInfo,
}: {
  user: MessagingUser
  infoId: string
  isInfoOpen: boolean
  onToggleInfo: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const callsUnavailable = () =>
    showToast({ tone: 'info', title: t('messages.callsUnavailable') })
  const status = useConnectionStatus()
  const name = displayName(user)
  return (
    <div>
      <BackLink />
      <Avatar
        name={name}
        src={getAvatarUrl(user.avatarUrl)}
        fallback="person"
      />
      <span>
        <h1>
          <RouterLink to={userProfilePath(user.username)}>{name}</RouterLink>
        </h1>
      </span>
      {status === 'reconnecting' ? (
        <span role="status">
          <span aria-hidden="true">⊘</span>
          <span>{t('messages.reconnecting')}</span>
        </span>
      ) : null}
      <div>
        <button
          type="button"
          aria-label={t('messages.voiceCall')}
          onClick={callsUnavailable}
        >
          {t('messages.voiceCall')}
        </button>
        <button
          type="button"
          aria-label={t('messages.videoCall')}
          onClick={callsUnavailable}
        >
          {t('messages.videoCall')}
        </button>
        <button
          type="button"
          aria-label={t('messages.info.toggle')}
          aria-pressed={isInfoOpen}
          aria-controls={isInfoOpen ? infoId : undefined}
          onClick={onToggleInfo}
        >
          {t('messages.info.toggle')}
        </button>
      </div>
    </div>
  )
}

// Why the composer is closed, from the newest failure that says so.
function closedReason(
  timeline: Timeline | undefined,
  isSuspended: boolean,
  now: number,
): ComposerClosed | undefined {
  if (timeline?.isBlockedByMe) return { reason: 'blockedByMe' }
  if (isSuspended) return { reason: 'suspended' }
  const failures = (timeline?.pending ?? []).flatMap((item) =>
    item.failure ? [item.failure] : [],
  )
  const permanent = failures.findLast(isPermanentFailure)
  if (permanent) return { reason: permanent.kind }
  const limited = failures.findLast((failure) => failure.kind === 'rateLimited')
  if (limited?.kind === 'rateLimited' && limited.retryAt > now) {
    return {
      reason: 'rateLimited',
      seconds: Math.ceil((limited.retryAt - now) / 1000),
    }
  }
  return undefined
}

function ConversationView({ user }: { user: MessagingUser }) {
  const { t } = useTranslation()
  const { viewerId } = useMessaging()
  const { isSuspended } = useSuspension()
  const query = useTimeline(user.id)
  const older = useOlderMessages(user.id)
  const actions = useConversationActions(user.id)
  const rootRef = useRef<HTMLDivElement>(null)
  const infoId = useId()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const name = displayName(user)
  const timeline = query.data
  const hasRateLimit = (timeline?.pending ?? []).some(
    (item) => item.failure?.kind === 'rateLimited',
  )
  const now = useNow(hasRateLimit)
  const closed = closedReason(timeline, isSuspended, now)
  const isReady = timeline !== undefined

  // When a conversation opens the cursor goes to its composer. On touch
  // screens, where that would raise the keyboard, focus goes to its name.
  useEffect(() => {
    if (!isReady) return
    const isTouch =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
    const textarea = rootRef.current?.querySelector('textarea')
    if (!isTouch && textarea && !textarea.disabled) {
      textarea.focus({ preventScroll: true })
      return
    }
    const heading = rootRef.current?.querySelector('h1')
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  }, [isReady, user.id])

  return (
    <div>
      <div ref={rootRef}>
        <ConversationHeader
          user={user}
          infoId={infoId}
          isInfoOpen={isInfoOpen}
          onToggleInfo={() => setIsInfoOpen((open) => !open)}
        />
        {query.isPending ? (
          <MessageListSkeleton />
        ) : query.isError || !timeline || !viewerId ? (
          <section role="alert">
            <h2>{t('messages.conversationError')}</h2>
            {
              <button
                type="button"
                aria-busy={query.isFetching || undefined}
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {t('common.retry')}
              </button>
            }
          </section>
        ) : timeline.messages.length === 0 && timeline.pending.length === 0 ? (
          <section>
            <h2>{t('messages.startTitle', { name })}</h2>
            <p>{t('messages.startHint')}</p>
          </section>
        ) : (
          <MessageList
            timeline={timeline}
            viewerId={viewerId}
            otherName={name}
            otherAvatarUrl={getAvatarUrl(user.avatarUrl)}
            older={older}
            onLoadOlder={older.loadOlder}
            onRetry={
              closed && closed.reason !== 'rateLimited'
                ? undefined
                : actions.retry
            }
            onDiscard={actions.discard}
            onMarkRead={actions.markRead}
          />
        )}
        {query.isPending ? (
          <ComposerSkeleton />
        ) : (
          <Composer
            key={user.id}
            draftKey={user.id}
            name={name}
            closed={closed}
            isDisabled={!isReady}
            onSend={actions.send}
          />
        )}
      </div>
      <ConversationInfo
        id={infoId}
        user={user}
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  )
}

// The conversation with the user a route names, whether or not it exists yet.
export function Conversation({ username }: { username: string }) {
  const { t } = useTranslation()
  const { viewerId } = useMessaging()
  const query = useMessagingUser(username)
  const inbox = useInbox()
  const knownUser = inbox.data?.pages
    .flatMap((page) => page.items)
    .find(
      (item) =>
        item.otherUser.username.toLowerCase() === username.toLowerCase(),
    )?.otherUser
  if (knownUser) return <ConversationView key={knownUser.id} user={knownUser} />
  const status = query.error instanceof ApiError ? query.error.status : null

  if (query.isPending) return <ConversationSkeleton />

  if (query.isError) {
    return (
      <div>
        <div>
          <BackLink />
        </div>
        <section role="alert">
          <h1>
            {t(
              status === 404
                ? 'messages.userNotFound'
                : 'messages.conversationError',
            )}
          </h1>
          <p>{status === 404 ? t('messages.userNotFoundHint') : undefined}</p>
          {status === 404 ? undefined : (
            <button
              type="button"
              aria-busy={query.isFetching || undefined}
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t('common.retry')}
            </button>
          )}
        </section>
      </div>
    )
  }

  if (query.data.id === viewerId) {
    return (
      <div>
        <div>
          <BackLink />
        </div>
        <section>
          <h1>{t('messages.selfTitle')}</h1>
          <p>{t('messages.selfHint')}</p>
        </section>
      </div>
    )
  }

  return <ConversationView key={query.data.id} user={query.data} />
}
