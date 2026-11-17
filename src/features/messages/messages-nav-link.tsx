import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import { Badge } from '@/components/badge/badge'
import { Icon } from '@/components/icon/icon'
import { MESSAGES_PATH } from '@/constants/routes'
import headerNavStyles from '@/styles/header-nav-link.module.scss'

import styles from './messages-nav-link.module.scss'
import { useUnreadConversationCount } from './use-messages'

// The header's round Messages button, with the number of conversations that
// have something unread. It updates as messages arrive.
export function MessagesNavLink() {
  const { t } = useTranslation()
  const unread = useUnreadConversationCount()

  return (
    <NavLink
      to={MESSAGES_PATH}
      className={headerNavStyles.link}
      aria-label={
        unread > 0
          ? t('messages.navUnread', { count: unread })
          : t('messages.title')
      }
    >
      <Icon name="message" />
      {unread > 0 ? (
        <Badge
          tone="primary"
          variant="solid"
          count={unread}
          className={styles.badge}
        />
      ) : null}
    </NavLink>
  )
}
