import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { useToast } from '@/components/toast/use-toast'
import { MESSAGES_PATH, userProfilePath } from '@/constants/routes'
import { useSuspension } from '@/features/current-user'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'

import type { ComposerClosed } from './composer'
import { Composer, ComposerSkeleton } from './composer'
import styles from './conversation.module.scss'
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
    <Link
      to={MESSAGES_PATH}
      variant="subtle"
      aria-label={t('messages.back')}
      className={styles.back}
    >
      <Icon name="arrow-left" />
    </Link>
  )
}

// The loading shape of a whole conversation: header, history, composer.
export function ConversationSkeleton() {
  return (
    <div className={styles.root}>
      <div className={styles.header} aria-hidden="true">
        <span className={styles.back}>
          <Skeleton
            shape="circle"
            width="var(--size-control-md)"
            height="var(--size-control-md)"
          />
        </span>
        <Skeleton
          shape="circle"
          width="var(--size-avatar-md)"
          height="var(--size-avatar-md)"
        />
        <span className={styles.identity}>
          <Text as="span" size="md">
            <Skeleton width="var(--space-9)" />
          </Text>
        </span>
        <div className={styles.headerActions}>
          {['phone', 'video', 'info'].map((action) => (
            <Skeleton
              key={action}
              shape="circle"
              className={styles.headerActionSkeleton}
              width="var(--size-icon-md)"
              height="var(--size-icon-md)"
            />
          ))}
        </div>
      </div>
      <MessageListSkeleton />
      <ComposerSkeleton />
    </div>
  )
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
    <div className={styles.header}>
      <BackLink />
      <Avatar
        name={name}
        src={getAvatarUrl(user.avatarUrl)}
        fallback="person"
        size="md"
        shape="circle"
      />
      <span className={styles.identity}>
        <Heading level={1} size="md" className={styles.name}>
          <Link
            to={userProfilePath(user.username)}
            variant="subtle"
            className={styles.profileLink}
          >
            {name}
          </Link>
        </Heading>
      </span>
      {status === 'reconnecting' ? (
        <Text
          as="span"
          size="xs"
          tone="warning"
          role="status"
          className={styles.status}
        >
          <Icon name="wifi-off" size="sm" />
          <span className={styles.statusText}>
            {t('messages.reconnecting')}
          </span>
        </Text>
      ) : null}
      <div className={styles.headerActions}>
        <Button
          variant="ghost"
          icon="phone"
          className={styles.headerAction}
          aria-label={t('messages.voiceCall')}
          onClick={callsUnavailable}
        />
        <Button
          variant="ghost"
          icon="video"
          className={styles.headerAction}
          aria-label={t('messages.videoCall')}
          onClick={callsUnavailable}
        />
        <Button
          variant="ghost"
          icon="info"
          className={styles.headerAction}
          aria-label={t('messages.info.toggle')}
          aria-pressed={isInfoOpen}
          aria-controls={isInfoOpen ? infoId : undefined}
          onClick={onToggleInfo}
        />
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
    <div className={styles.view}>
      <div ref={rootRef} className={styles.root}>
        <ConversationHeader
          user={user}
          infoId={infoId}
          isInfoOpen={isInfoOpen}
          onToggleInfo={() => setIsInfoOpen((open) => !open)}
        />
        {query.isPending ? (
          <MessageListSkeleton />
        ) : query.isError || !timeline || !viewerId ? (
          <EmptyState
            size="sm"
            role="alert"
            icon="alert-circle"
            headingLevel={2}
            title={t('messages.conversationError')}
            className={styles.state}
            action={
              <Button
                variant="secondary"
                isLoading={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {t('common.retry')}
              </Button>
            }
          />
        ) : timeline.messages.length === 0 && timeline.pending.length === 0 ? (
          <EmptyState
            size="sm"
            icon="hand-wave"
            headingLevel={2}
            title={t('messages.startTitle', { name })}
            description={t('messages.startHint')}
            className={styles.state}
          />
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
      <div className={styles.root}>
        <div className={styles.header}>
          <BackLink />
        </div>
        <EmptyState
          size="sm"
          role="alert"
          icon={status === 404 ? 'user-x' : 'alert-circle'}
          headingLevel={1}
          className={styles.state}
          title={t(
            status === 404
              ? 'messages.userNotFound'
              : 'messages.conversationError',
          )}
          description={
            status === 404 ? t('messages.userNotFoundHint') : undefined
          }
          action={
            status === 404 ? undefined : (
              <Button
                variant="secondary"
                isLoading={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {t('common.retry')}
              </Button>
            )
          }
        />
      </div>
    )
  }

  if (query.data.id === viewerId) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <BackLink />
        </div>
        <EmptyState
          size="sm"
          icon="user"
          headingLevel={1}
          className={styles.state}
          title={t('messages.selfTitle')}
          description={t('messages.selfHint')}
        />
      </div>
    )
  }

  return <ConversationView key={query.data.id} user={query.data} />
}
