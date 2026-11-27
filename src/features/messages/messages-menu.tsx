import type { ComponentPropsWithRef, MouseEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Icon } from '@/components/icon/icon'
import { Popover } from '@/components/popover/popover'
import { Tooltip } from '@/components/tooltip/tooltip'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { MESSAGES_PATH } from '@/constants/routes'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { InboxRow, InboxSkeletonRows } from './inbox'
import { useMessaging } from './messaging-context'
import { useInbox, useUnreadConversationCount } from './use-messages'

type MessagesButtonProps = ComponentPropsWithRef<'button'> & {
  // Conversations with something unread; above zero they show as a badge.
  unread?: number
}

// The header's round Messages button. A Popover trigger's aria and click props
// pass through to the button.
function MessagesButton({ unread = 0, ...props }: MessagesButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      aria-label={
        unread > 0
          ? t('messages.navUnread', { count: unread })
          : t('messages.title')
      }
      {...props}
    >
      <Icon name="message" />
      {unread > 0 ? (
        <Badge tone="primary" variant="solid" count={unread} />
      ) : null}
    </button>
  )
}

// The conversations in the dropdown: newest activity first, loading more as
// the list scrolls.
function MessagesPreview() {
  const { t } = useTranslation()
  const { viewerId } = useMessaging()
  const query = useInbox()
  const { sentinelRef, isAutomatic } = useInfiniteScroll({
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    isPaused: query.isFetchNextPageError,
    onLoadMore: () => void query.fetchNextPage(),
  })
  const conversations = query.data?.pages.flatMap((page) => page.items) ?? []

  if (query.isPending) {
    return (
      <div role="status">
        <VisuallyHidden>{t('messages.loading')}</VisuallyHidden>
        <InboxSkeletonRows count={6} />
      </div>
    )
  }

  if (query.isError && !query.data) {
    return (
      <EmptyState
        size="sm"
        role="alert"
        icon="alert-circle"
        headingLevel={3}
        title={t('messages.loadError')}
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
    )
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon="messages"
        headingLevel={3}
        title={t('messages.empty')}
        description={t('messages.emptyHint')}
      />
    )
  }

  return (
    <>
      <ul aria-label={t('messages.inboxLabel')}>
        {conversations.map((conversation) => (
          <InboxRow
            key={conversation.id}
            conversation={conversation}
            viewerId={viewerId}
            isActive={false}
            hasMenu={false}
          />
        ))}
      </ul>
      {query.hasNextPage ? (
        <div ref={sentinelRef}>
          {query.isFetchNextPageError ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void query.fetchNextPage()}
            >
              {t('common.retry')}
            </Button>
          ) : query.isFetchingNextPage ? (
            <div role="status">
              <VisuallyHidden>{t('messages.loading')}</VisuallyHidden>
              <InboxSkeletonRows count={2} />
            </div>
          ) : !isAutomatic ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void query.fetchNextPage()}
            >
              {t('messages.loadMore')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

// The header's Messages button. It opens the latest conversations in a
// dropdown; the full page stays one button away.
export function MessagesMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const unread = useUnreadConversationCount()

  // Opening a conversation leaves the dropdown.
  function closeOnNavigate(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('a')) setIsOpen(false)
  }

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      label={t('messages.title')}
      placement="bottom-end"
      trigger={<MessagesButton unread={unread} />}
    >
      {/* Clicks only bubble up from links; keyboard follows via the link's own click. */}
      <div onClick={closeOnNavigate}>
        <div>
          <h2>{t('messages.title')}</h2>
          <Tooltip content={t('messages.openFull')}>
            <Button
              icon="maximize"
              variant="ghost"
              size="sm"
              aria-label={t('messages.openFull')}
              onClick={() => {
                setIsOpen(false)
                navigate(MESSAGES_PATH)
              }}
            />
          </Tooltip>
        </div>
        <div className="messages-menu-scroller">
          <MessagesPreview />
        </div>
      </div>
    </Popover>
  )
}
