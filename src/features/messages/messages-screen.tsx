import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state/empty-state'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { NotFoundState } from '@/features/not-found'

import { Conversation, ConversationSkeleton } from './conversation'
import { Inbox, InboxHeader, InboxSkeletonRows } from './inbox'

// "@mai" → "mai"; anything else isn't a conversation route.
function usernameFromHandle(handle: string | undefined) {
  if (handle === undefined) return undefined
  return handle.startsWith('@') && handle.length > 1 ? handle.slice(1) : null
}

// The inbox beside the open conversation; on small screens one at a time,
// with a way back from the conversation.
export function MessagesScreen({ handle }: { handle?: string }) {
  const { t } = useTranslation()
  const username = usernameFromHandle(handle)

  if (username === null) return <NotFoundState />

  const isOpen = username !== undefined

  return (
    <div data-messages-page="" data-open={isOpen || undefined}>
      <section className="messages-screen-inbox">
        <Inbox activeUsername={username} headingLevel={isOpen ? 2 : 1} />
      </section>
      <section className="messages-screen-conversation">
        {username ? (
          <Conversation key={username.toLowerCase()} username={username} />
        ) : (
          <EmptyState
            icon="messages"
            headingLevel={2}
            title={t('messages.selectTitle')}
            description={t('messages.selectHint')}
          />
        )}
      </section>
    </div>
  )
}

// The page's shape while the session loads.
export function MessagesScreenSkeleton({
  isOpen = false,
}: {
  isOpen?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div data-messages-page="" data-open={isOpen || undefined} role="status">
      <VisuallyHidden>{t('messages.loading')}</VisuallyHidden>
      <section className="messages-screen-inbox" aria-hidden="true">
        <div className="inbox-scroller">
          <InboxHeader headingLevel={isOpen ? 2 : 1} />
          <InboxSkeletonRows />
        </div>
      </section>
      <section className="messages-screen-conversation" aria-hidden="true">
        {isOpen ? <ConversationSkeleton /> : null}
      </section>
    </div>
  )
}
