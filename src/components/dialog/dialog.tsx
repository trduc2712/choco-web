import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Heading } from '@/components/heading/heading'
import { Text } from '@/components/text/text'
import { cx } from '@/lib/cx'

import styles from './dialog.module.scss'

export type DialogSize = 'sm' | 'md' | 'lg'

export type DialogProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: DialogSize
  className?: string
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: DialogProps) {
  const { t } = useTranslation()
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={cx(styles.root, styles[size], className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={handleClick}
    >
      <div className={styles.header}>
        <div className={styles.heading}>
          <Heading id={titleId} level={2} size="lg">
            {title}
          </Heading>
          {description && (
            <Text id={descriptionId} tone="muted" size="sm">
              {description}
            </Text>
          )}
        </div>
        <Button
          icon="close"
          variant="ghost"
          size="sm"
          aria-label={t('common.close')}
          onClick={onClose}
        />
      </div>
      {children && <div className={styles.body}>{children}</div>}
      {footer && <div className={styles.footer}>{footer}</div>}
    </dialog>
  )
}
