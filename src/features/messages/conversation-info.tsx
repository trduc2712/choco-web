import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Dialog } from '@/components/dialog/dialog'
import { userProfilePath } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/use-media-query'
import { getAvatarUrl } from '@/lib/avatar-url'

import { displayName } from './message-format'
import type { MessagingUser } from './messaging-types'

// Wide enough for the details to sit beside the chat.
const SIDE_PANEL_QUERY = '(min-width: 1024px)'

function Details({ user }: { user: MessagingUser }) {
  const { t } = useTranslation()
  const name = displayName(user)
  return (
    <div>
      <Avatar
        name={name}
        src={getAvatarUrl(user.avatarUrl)}
        fallback="person"
      />
      <div>
        <p>{name}</p>
      </div>
      <RouterLink to={userProfilePath(user.username)}>
        <span>
          <span aria-hidden="true">♙</span>
        </span>
        {t('messages.info.profile')}
      </RouterLink>
    </div>
  )
}

// Who the conversation is with: a column beside the chat on wide screens, a
// drawer on narrow ones.
export function ConversationInfo({
  id,
  user,
  isOpen,
  onClose,
}: {
  id: string
  user: MessagingUser
  isOpen: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const isSidePanel = useMediaQuery(SIDE_PANEL_QUERY)

  if (isSidePanel) {
    return isOpen ? (
      <aside id={id} aria-labelledby={`${id}-title`}>
        <h2 id={`${id}-title`}>{t('messages.info.title')}</h2>
        <Details user={user} />
      </aside>
    ) : null
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t('messages.info.title')}>
      <Details user={user} />
    </Dialog>
  )
}
