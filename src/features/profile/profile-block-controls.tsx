import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Button } from '@/components/button/button'
import { Menu } from '@/components/menu/menu'
import type { useBlockUser } from '@/features/blocks'
import { ReportDialog } from '@/features/reports'

export type ProfileBlock = ReturnType<typeof useBlockUser> & {
  isBlocked: boolean
  // The profile's owner, for Report.
  userId: string
}

// Unblocked: a "more" menu with Block, which asks first because blocking also
// removes follows. Blocked: an Unblock button.
export function ProfileBlockControls({
  userId,
  name,
  username,
  block,
  isReadOnly = false,
}: {
  userId: string
  name: string
  username: string
  block: ProfileBlock
  isReadOnly?: boolean
}) {
  const { t } = useTranslation()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const unblockRef = useRef<HTMLButtonElement>(null)

  function confirmBlock() {
    block.setBlocked(true, {
      onSettled: () => {
        setIsConfirming(false)
        // The menu that opened the dialog is gone once the block succeeds.
        requestAnimationFrame(() => unblockRef.current?.focus())
      },
    })
  }

  return (
    <>
      {block.isBlocked ? (
        <Button
          ref={unblockRef}
          variant="secondary"
          iconStart="user-x"
          isLoading={block.isPending}
          disabled={isReadOnly}
          onClick={() => block.setBlocked(false)}
        >
          {t('blocks.unblock')}
        </Button>
      ) : null}
      <Menu
        label={t('blocks.moreActions', { name })}
        isLabelHidden
        icon="more-horizontal"
        align="end"
        items={[
          ...(block.isBlocked
            ? []
            : [
                {
                  id: 'block',
                  label: t('blocks.blockUser', { username }),
                  icon: 'user-x' as const,
                  tone: 'danger' as const,
                  isDisabled: isReadOnly,
                  onSelect: () => setIsConfirming(true),
                },
              ]),
          {
            id: 'report',
            label: t('reports.menu.reportUser', { username }),
            icon: 'flag' as const,
            tone: 'danger' as const,
            isDisabled: isReadOnly,
            onSelect: () => setIsReporting(true),
          },
        ]}
      />
      {isReporting ? (
        <ReportDialog
          target={{ type: 'User', id: userId }}
          onClose={() => setIsReporting(false)}
        />
      ) : null}
      <AlertDialog
        isOpen={isConfirming}
        title={t('blocks.confirmTitle', { username })}
        description={t('blocks.confirmDescription')}
        confirmLabel={t('blocks.block')}
        isConfirming={block.isPending}
        onConfirm={confirmBlock}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  )
}
