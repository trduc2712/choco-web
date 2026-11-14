import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { EmptyState } from '@/components/empty-state/empty-state'
import type { UserSearchItem } from '@/features/user-search'
import { UserResultList } from '@/features/user-search'
import { ApiError } from '@/lib/api-client'

import styles from './blocked-users-list.module.scss'
import { useBlockedUsers, useBlockUser } from './blocks-api'

// The viewer's blocked users, with an Unblock button on each row.
export function BlockedUsersList() {
  const { t } = useTranslation()
  const blocked = useBlockedUsers()
  const status =
    blocked.error instanceof ApiError ? blocked.error.status : undefined

  return (
    <Card className={styles.card}>
      <UserResultList
        isCompact
        results={blocked}
        loadingLabel={t('blocks.loading')}
        errorTitle={t(
          status === 401 ? 'profile.sessionError' : 'blocks.loadError',
        )}
        empty={
          <EmptyState
            size="sm"
            role="status"
            icon="user-x"
            title={t('blocks.empty')}
            description={t('blocks.emptyHint')}
          />
        }
        renderAction={(user) => <UnblockButton user={user} />}
      />
    </Card>
  )
}

function UnblockButton({ user }: { user: UserSearchItem }) {
  const { t } = useTranslation()
  const { isPending, setBlocked } = useBlockUser(user.id, user.username)
  const [isConfirming, setIsConfirming] = useState(false)
  const name = user.displayName.trim() || user.username
  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        aria-label={t('blocks.unblockUser', { name })}
        onClick={() => setIsConfirming(true)}
      >
        {t('blocks.unblock')}
      </Button>
      <AlertDialog
        isOpen={isConfirming}
        tone="primary"
        title={t('blocks.unblockConfirmTitle', { username: user.username })}
        description={t('blocks.unblockConfirmDescription')}
        confirmLabel={t('blocks.unblock')}
        isConfirming={isPending}
        onConfirm={() =>
          setBlocked(false, { onSettled: () => setIsConfirming(false) })
        }
        onCancel={() => setIsConfirming(false)}
      />
    </>
  )
}
