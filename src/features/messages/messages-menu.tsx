import type { ComponentPropsWithRef, MouseEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Popover } from '@/components/popover/popover'
import { Tooltip } from '@/components/tooltip/tooltip'
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
      <span aria-hidden="true">💬</span>
      {unread > 0 ? (
        <span>{unread > 99 ? t('badge.overflow', { max: 99 }) : unread}</span>
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
        <span className="visually-hidden">{t('messages.loading')}</span>
        <InboxSkeletonRows />
      </div>
    )
  }

  if (query.isError && !query.data) {
    return (
      <section role="alert">
        <h3>{t('messages.loadError')}</h3>
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
    )
  }

  if (conversations.length === 0) {
    return (
      <section>
        <h3>{t('messages.empty')}</h3>
        <p>{t('messages.emptyHint')}</p>
      </section>
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
            <button type="button" onClick={() => void query.fetchNextPage()}>
              {t('common.retry')}
            </button>
          ) : query.isFetchingNextPage ? (
            <div role="status">
              <span className="visually-hidden">{t('messages.loading')}</span>
              <InboxSkeletonRows />
            </div>
          ) : !isAutomatic ? (
            <button type="button" onClick={() => void query.fetchNextPage()}>
              {t('messages.loadMore')}
            </button>
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
            <button
              type="button"
              aria-label={t('messages.openFull')}
              onClick={() => {
                setIsOpen(false)
                navigate(MESSAGES_PATH)
              }}
            >
              {t('messages.openFull')}
            </button>
          </Tooltip>
        </div>
        <div className="messages-menu-scroller">
          <MessagesPreview />
        </div>
      </div>
    </Popover>
  )
}
