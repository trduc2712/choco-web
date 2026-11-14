import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Heading } from '@/components/heading/heading'
import { Text } from '@/components/text/text'
import { cx } from '@/lib/cx'

import styles from './dialog.module.scss'

export type DialogSize = 'sm' | 'md' | 'lg'
export type DialogFooterAlign = 'end' | 'start' | 'between'

export type DialogProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: DialogSize
  // A social-style layout: the title is centered over a divider, and the body
  // and footer have no padding of their own, so content can run edge to edge.
  isFlush?: boolean
  // Content at the start of the header, opposite the close button, such as a
  // badge. The title stays in the middle.
  headerExtra?: ReactNode
  // Where the footer puts its content: at the end (default), at the start, or
  // spread to both ends.
  footerAlign?: DialogFooterAlign
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
  isFlush = false,
  headerExtra,
  footerAlign = 'end',
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
      className={cx(
        styles.root,
        styles[size],
        isFlush && styles.flush,
        styles[`footer-${footerAlign}`],
        className,
      )}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={handleClick}
    >
      <div className={styles.header}>
        {headerExtra ? <div className={styles.extra}>{headerExtra}</div> : null}
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
