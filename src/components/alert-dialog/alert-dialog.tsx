import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Text } from '@/components/text/text'
import { cx } from '@/lib/cx'

import styles from './alert-dialog.module.scss'

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
      className={cx(styles.root, className)}
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
      <div className={styles.content}>
        <span className={cx(styles.icon, styles[tone])}>
          <Icon name={tone === 'danger' ? 'alert-triangle' : 'help-circle'} />
        </span>
        <div className={styles.text}>
          <Heading id={titleId} level={2} size="lg">
            {title}
          </Heading>
          <Text id={descriptionId} tone="muted" size="sm">
            {description}
          </Text>
          {children}
        </div>
      </div>
      <div className={styles.footer}>
        <Button
          ref={cancelRef}
          variant="secondary"
          disabled={isConfirming}
          onClick={onCancel}
        >
          {cancelLabel ?? t('alertDialog.cancel')}
        </Button>
        <Button variant={tone} isLoading={isConfirming} onClick={onConfirm}>
          {confirmLabel ?? t('alertDialog.confirm')}
        </Button>
      </div>
    </dialog>
  )
}
