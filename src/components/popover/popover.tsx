import type { FocusEvent, MouseEvent, ReactElement, ReactNode } from 'react'
import { cloneElement, useCallback, useId } from 'react'

import { Heading } from '@/components/heading/heading'
import { Portal } from '@/components/portal/portal'
import { useControllableState } from '@/hooks/use-controllable-state'
import { useDismiss } from '@/hooks/use-dismiss'
import type { FloatingPlacement } from '@/hooks/use-floating'
import { useFloating } from '@/hooks/use-floating'
import { cx } from '@/lib/cx'

import styles from './popover.module.scss'

export type PopoverPlacement = FloatingPlacement

type TriggerProps = {
  'aria-haspopup'?: 'dialog'
  'aria-expanded'?: boolean
  'aria-controls'?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
}

export type PopoverProps = {
  trigger: ReactElement<TriggerProps>
  children: ReactNode
  title?: string
  label?: string
  placement?: PopoverPlacement
  isOpen?: boolean
  defaultOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  className?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Popover({
  trigger,
  children,
  title,
  label,
  placement = 'bottom-start',
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  className,
}: PopoverProps) {
  const id = useId()
  const panelId = `${id}-popover`
  const titleId = `${id}-title`
  const [isOpen, setIsOpen] = useControllableState({
    value: isOpenProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const { anchorRef, floatingRef, setFloating, style, side } = useFloating<
    HTMLSpanElement,
    HTMLDivElement
  >({ isOpen, placement, offset: 8 })
  // Runs once when the panel mounts. Content that places focus itself, like
  // a calendar, does so in a later effect and keeps it.
  const attachPanel = useCallback(
    (panel: HTMLDivElement | null) => {
      setFloating(panel)

      if (panel) {
        const target = panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel
        target.focus()
      }
    },
    [setFloating],
  )

  function close(shouldRestoreFocus: boolean) {
    setIsOpen(false)

    if (shouldRestoreFocus) {
      anchorRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }
  }

  useDismiss({
    isEnabled: isOpen,
    refs: [anchorRef, floatingRef],
    onDismiss: (reason) => close(reason === 'escape'),
  })

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget

    if (
      next instanceof Node &&
      !floatingRef.current?.contains(next) &&
      !anchorRef.current?.contains(next)
    ) {
      close(false)
    }
  }

  return (
    <span ref={anchorRef} className={styles.anchor}>
      {cloneElement(trigger, {
        'aria-haspopup': 'dialog',
        'aria-expanded': isOpen,
        'aria-controls': isOpen ? panelId : undefined,
        onClick: (event: MouseEvent<HTMLElement>) => {
          trigger.props.onClick?.(event)
          setIsOpen(!isOpen)
        },
      })}
      {isOpen && (
        <Portal anchorRef={anchorRef}>
          <div
            ref={attachPanel}
            id={panelId}
            className={cx(styles.panel, className)}
            style={style}
            role="dialog"
            aria-label={title ? undefined : label}
            aria-labelledby={title ? titleId : undefined}
            data-side={side}
            tabIndex={-1}
            onBlur={handleBlur}
          >
            {title && (
              <Heading id={titleId} level={2} size="sm">
                {title}
              </Heading>
            )}
            {children}
          </div>
        </Portal>
      )}
    </span>
  )
}
