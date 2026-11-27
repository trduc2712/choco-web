import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { Drawer } from '@/components/drawer/drawer'
import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { userProfilePath } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/use-media-query'
import { getAvatarUrl } from '@/lib/avatar-url'

import { displayName } from './message-format'
import type { MessagingUser } from './messaging-types'

// Wide enough for the details to sit beside the chat (Ares' lg breakpoint).
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
        size="xl"
        shape="circle"
      />
      <div>
        <Text size="lg" weight="semibold" align="center">
          {name}
        </Text>
      </div>
      <Link to={userProfilePath(user.username)} variant="subtle">
        <span>
          <Icon name="user-circle" />
        </span>
        {t('messages.info.profile')}
      </Link>
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
        <Heading id={`${id}-title`} level={2} size="sm">
          {t('messages.info.title')}
        </Heading>
        <Details user={user} />
      </aside>
    ) : null
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('messages.info.title')}
      side="end"
      size="sm"
    >
      <Details user={user} />
    </Drawer>
  )
}
