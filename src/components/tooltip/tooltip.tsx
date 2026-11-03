import type { ReactElement } from 'react'
import { cloneElement, useEffect, useId, useRef, useState } from 'react'

import { Portal } from '@/components/portal/portal'
import type { FloatingPlacement } from '@/hooks/use-floating'
import { useFloating } from '@/hooks/use-floating'
import { cx } from '@/lib/cx'

import styles from './tooltip.module.scss'

export type TooltipPlacement = FloatingPlacement

export type TooltipProps = {
  content: string
  placement?: TooltipPlacement
  children: ReactElement<{ 'aria-describedby'?: string }>
  className?: string
}

const HIDE_DELAY_MS = 100

export function Tooltip({
  content,
  placement = 'top',
  children,
  className,
}: TooltipProps) {
  const id = useId()
  const [isOpen, setIsOpen] = useState(false)
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { anchorRef, setFloating, style, side } = useFloating<
    HTMLSpanElement,
    HTMLSpanElement
  >({ isOpen, placement, offset: 8 })

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

  useEffect(() => () => clearTimeout(hideTimeout.current), [])

  function show() {
    clearTimeout(hideTimeout.current)
    setIsOpen(true)
  }

  // A short delay lets the pointer move onto the tooltip without it closing.
  function hideSoon() {
    clearTimeout(hideTimeout.current)
    hideTimeout.current = setTimeout(() => setIsOpen(false), HIDE_DELAY_MS)
  }

  return (
    <span
      ref={anchorRef}
      className={cx(styles.root, className)}
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onFocus={show}
      onBlur={() => setIsOpen(false)}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <Portal anchorRef={anchorRef}>
        <span
          ref={setFloating}
          id={id}
          className={cx(styles.tooltip, styles[side])}
          style={style}
          role="tooltip"
          hidden={!isOpen}
          onMouseEnter={show}
          onMouseLeave={hideSoon}
        >
          <span className={styles.bubble}>{content}</span>
        </span>
      </Portal>
    </span>
  )
}
