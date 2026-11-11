import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Button } from '@/components/button/button'
import { Menu } from '@/components/menu/menu'
import type { useBlockUser } from '@/features/blocks'

export type ProfileBlock = ReturnType<typeof useBlockUser> & {
  isBlocked: boolean
}

// Unblocked: a "more" menu with Block, which asks first because blocking also
// removes follows. Blocked: an Unblock button.
export function ProfileBlockControls({
  name,
  username,
  block,
}: {
  name: string
  username: string
  block: ProfileBlock
}) {
  const { t } = useTranslation()
  const [isConfirming, setIsConfirming] = useState(false)
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
          onClick={() => block.setBlocked(false)}
        >
          {t('blocks.unblock')}
        </Button>
      ) : (
        <Menu
          label={t('blocks.moreActions', { name })}
          isLabelHidden
          icon="more-horizontal"
          align="end"
          items={[
            {
              id: 'block',
              label: t('blocks.blockUser', { username }),
              icon: 'user-x',
              tone: 'danger',
              onSelect: () => setIsConfirming(true),
            },
          ]}
        />
      )}
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
