import type { ReactElement, ReactNode } from 'react'
import { cloneElement, useEffect, useId, useRef, useState } from 'react'

import { Portal } from '@/components/portal/portal'
import type { FloatingPlacement } from '@/hooks/use-floating'
import { useFloating } from '@/hooks/use-floating'
import { cx } from '@/lib/cx'

import styles from './hover-card.module.scss'

export type HoverCardPlacement = FloatingPlacement

export type HoverCardProps = {
  trigger: ReactElement<{ 'aria-describedby'?: string }>
  children: ReactNode
  placement?: HoverCardPlacement
  openDelay?: number
  closeDelay?: number
  className?: string
}

export function HoverCard({
  trigger,
  children,
  placement = 'bottom',
  openDelay = 400,
  closeDelay = 200,
  className,
}: HoverCardProps) {
  const id = useId()
  const [isOpen, setIsOpen] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { anchorRef, setFloating, style, side } = useFloating<
    HTMLSpanElement,
    HTMLDivElement
  >({ isOpen, placement, offset: 8 })

  useEffect(() => () => clearTimeout(timeout.current), [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  function schedule(next: boolean, delay: number) {
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => setIsOpen(next), delay)
  }

  return (
    <span
      ref={anchorRef}
      className={styles.anchor}
      onMouseEnter={() => schedule(true, openDelay)}
      onMouseLeave={() => schedule(false, closeDelay)}
      onFocus={() => schedule(true, 0)}
      onBlur={() => schedule(false, 0)}
    >
      {cloneElement(trigger, { 'aria-describedby': isOpen ? id : undefined })}
      {isOpen && (
        <Portal anchorRef={anchorRef}>
          <div
            ref={setFloating}
            id={id}
            className={cx(styles.card, className)}
            style={style}
            data-side={side}
            onMouseEnter={() => clearTimeout(timeout.current)}
            onMouseLeave={() => schedule(false, closeDelay)}
          >
            {children}
          </div>
        </Portal>
      )}
    </span>
  )
}
