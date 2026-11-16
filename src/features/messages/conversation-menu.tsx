import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Menu } from '@/components/menu/menu'
import { userProfilePath } from '@/constants/routes'
import { useBlockUser } from '@/features/blocks'
import { ReportDialog } from '@/features/reports'

import styles from './inbox.module.scss'
import { displayName } from './message-format'
import type { Conversation, MessagingUser } from './messaging-types'
import { useConversationActions } from './use-messages'

function BlockDialog({
  user,
  onClose,
}: {
  user: MessagingUser
  onClose: () => void
}) {
  const { t } = useTranslation()
  const block = useBlockUser(user.id, user.username)
  const { refreshInbox } = useConversationActions(user.id)
  return (
    <AlertDialog
      isOpen
      title={t('blocks.confirmTitle', { username: user.username })}
      description={t('blocks.confirmDescription')}
      confirmLabel={t('blocks.block')}
      isConfirming={block.isPending}
      onConfirm={() =>
        block.setBlocked(true, {
          onSettled: () => {
            refreshInbox()
            onClose()
          },
        })
      }
      onCancel={onClose}
    />
  )
}

// The "…" on an inbox row: open the profile, mark it read, block or report.
export function ConversationMenu({
  conversation,
}: {
  conversation: Conversation
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { otherUser, lastMessage, unreadCount } = conversation
  const actions = useConversationActions(otherUser.id)
  const [dialog, setDialog] = useState<'block' | 'report' | null>(null)

  return (
    <>
      <Menu
        className={styles.menu}
        label={t('messages.row.more', { name: displayName(otherUser) })}
        isLabelHidden
        icon="more-horizontal"
        variant="secondary"
        size="sm"
        align="end"
        items={[
          {
            id: 'profile',
            label: t('messages.info.profile'),
            icon: 'user-circle' as const,
            onSelect: () => void navigate(userProfilePath(otherUser.username)),
          },
          ...(unreadCount > 0 && lastMessage
            ? [
                {
                  id: 'read',
                  label: t('messages.row.markRead'),
                  icon: 'check' as const,
                  onSelect: () =>
                    actions.markRead(conversation.id, lastMessage.sequence),
                },
              ]
            : []),
          {
            id: 'block',
            label: t('blocks.blockUser', { username: otherUser.username }),
            icon: 'user-x' as const,
            tone: 'danger' as const,
            onSelect: () => setDialog('block'),
          },
          {
            id: 'report',
            label: t('reports.menu.reportUser', {
              username: otherUser.username,
            }),
            icon: 'flag' as const,
            tone: 'danger' as const,
            onSelect: () => setDialog('report'),
          },
        ]}
      />
      {dialog === 'block' ? (
        <BlockDialog user={otherUser} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === 'report' ? (
        <ReportDialog
          target={{ type: 'User', id: otherUser.id }}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </>
  )
}
