import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useId, useRef, useState } from 'react'

import menuStyles from '@/components/menu/menu.module.scss'
import { MenuList } from '@/components/menu/menu-list'
import type { MenuEntry } from '@/components/menu/menu-sections'
import { Portal } from '@/components/portal/portal'
import { useDismiss } from '@/hooks/use-dismiss'
import { useFloating } from '@/hooks/use-floating'
import { cx } from '@/lib/cx'

import styles from './context-menu.module.scss'

export type ContextMenuProps = {
  label: string
  items: MenuEntry[]
  children: ReactNode
  isDisabled?: boolean
  className?: string
}

type Point = { x: number; y: number }

export function ContextMenu({
  label,
  items,
  children,
  isDisabled = false,
  className,
}: ContextMenuProps) {
  const id = useId()
  const menuId = `${id}-menu`
  const regionRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const submenuRef = useRef<HTMLDivElement>(null)
  const [point, setPoint] = useState<Point>()
  const isOpen = point !== undefined
  const { anchorRef, floatingRef, setFloating, style, side } = useFloating<
    HTMLSpanElement,
    HTMLDivElement
  >({ isOpen, placement: 'bottom-start', offset: 0 })

  function open(next: Point) {
    restoreRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    setPoint(next)
  }

  function close(shouldRestoreFocus: boolean) {
    setPoint(undefined)

    if (shouldRestoreFocus) {
      restoreRef.current?.focus()
    }
  }

  useDismiss({
    isEnabled: isOpen,
    refs: [floatingRef, submenuRef],
    onDismiss: (reason) => close(reason === 'escape'),
  })

  function handleContextMenu(event: MouseEvent<HTMLDivElement>) {
    if (isDisabled) {
      return
    }

    event.preventDefault()
    open({ x: event.clientX, y: event.clientY })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      isDisabled ||
      !(event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))
    ) {
      return
    }

    event.preventDefault()
    const target =
      event.target instanceof Element ? event.target : regionRef.current
    const rect = target?.getBoundingClientRect()
    open({ x: rect?.left ?? 0, y: rect?.bottom ?? 0 })
  }

  return (
    <div
      ref={regionRef}
      className={cx(styles.root, className)}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
    >
      {children}
      {point && (
        <Portal anchorRef={regionRef}>
          <span
            ref={anchorRef}
            className={menuStyles.virtualAnchor}
            style={{ top: point.y, left: point.x }}
          />
          <MenuList
            id={menuId}
            label={label}
            entries={items}
            initialFocus="first"
            listRef={setFloating}
            submenuRef={submenuRef}
            style={style}
            side={side}
            onClose={close}
          />
        </Portal>
      )}
    </div>
  )
}
