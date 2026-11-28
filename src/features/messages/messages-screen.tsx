import { useTranslation } from 'react-i18next'

import { NotFoundState } from '@/features/not-found'

import { Conversation } from './conversation'
import { Inbox } from './inbox'

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
          <section>
            <h2>{t('messages.selectTitle')}</h2>
            <p>{t('messages.selectHint')}</p>
          </section>
        )}
      </section>
    </div>
  )
}

export function MessagesScreenSkeleton() {
  const { t } = useTranslation()
  return <span role="status">{t('messages.loading')}</span>
}
