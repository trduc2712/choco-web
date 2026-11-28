import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import type { UserSearchItem } from '@/features/user-search'
import { UserResultList, UserRowSkeletons } from '@/features/user-search'
import { ApiError } from '@/lib/api-client'

import { useBlockedUsers, useBlockUser } from './blocks-api'

// The viewer's blocked users, with an Unblock button on each row.
export function BlockedUsersList() {
  const { t } = useTranslation()
  const blocked = useBlockedUsers()
  const status =
    blocked.error instanceof ApiError ? blocked.error.status : undefined

  return (
    <div>
      <UserResultList
        isCompact
        results={blocked}
        loadingLabel={t('blocks.loading')}
        errorTitle={t(
          status === 401 ? 'profile.sessionError' : 'blocks.loadError',
        )}
        empty={
          <section role="status">
            <h2>{t('blocks.empty')}</h2>
            <p>{t('blocks.emptyHint')}</p>
          </section>
        }
        renderAction={(user) => <UnblockButton user={user} />}
      />
    </div>
  )
}

// The list's card while the page loads.
export function BlockedUsersSkeleton() {
  const { t } = useTranslation()
  return (
    <div>
      <UserRowSkeletons label={t('blocks.loading')} />
    </div>
  )
}

function UnblockButton({ user }: { user: UserSearchItem }) {
  const { t } = useTranslation()
  const { isPending, setBlocked } = useBlockUser(user.id, user.username)
  const [isConfirming, setIsConfirming] = useState(false)
  const name = user.displayName.trim() || user.username
  return (
    <>
      <button
        type="button"
        aria-label={t('blocks.unblockUser', { name })}
        onClick={() => setIsConfirming(true)}
      >
        {t('blocks.unblock')}
      </button>
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
