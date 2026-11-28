import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { symbols } from '@/lib/symbols'

export type AlertDialogTone = 'danger' | 'primary'

export type AlertDialogProps = {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  tone?: AlertDialogTone
  isConfirming?: boolean
  children?: ReactNode
  className?: string
}

export function AlertDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  isConfirming = false,
  children,
  className,
}: AlertDialogProps) {
  const { t } = useTranslation()
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
      // The least destructive choice gets focus first.
      cancelRef.current?.focus()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className={className}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        if (isConfirming) {
          event.preventDefault()
        }
      }}
      onClose={() => {
        if (isOpen) {
          onCancel()
        }
      }}
    >
      <div>
        <span>
          <span aria-hidden="true">
            {symbols[tone === 'danger' ? 'alert-triangle' : 'help-circle']}
          </span>
        </span>
        <div>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
          {children}
        </div>
      </div>
      <div>
        <button
          type="button"
          ref={cancelRef}
          disabled={isConfirming}
          onClick={onCancel}
        >
          {cancelLabel ?? t('alertDialog.cancel')}
        </button>
        <button
          type="button"
          aria-busy={isConfirming || undefined}
          disabled={isConfirming}
          onClick={onConfirm}
        >
          {confirmLabel ?? t('alertDialog.confirm')}
        </button>
      </div>
    </dialog>
  )
}
