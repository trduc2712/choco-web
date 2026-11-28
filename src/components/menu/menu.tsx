import type { KeyboardEvent, ReactNode } from 'react'
import { useId, useRef, useState } from 'react'

import { Portal } from '@/components/portal/portal'
import { useDismiss } from '@/hooks/use-dismiss'
import type { FloatingPlacement } from '@/hooks/use-floating'
import { useFloating } from '@/hooks/use-floating'
import type { SymbolName } from '@/lib/symbols'
import { symbols } from '@/lib/symbols'

import { MenuList } from './menu-list'
import type { MenuEntry, MenuInitialFocus } from './menu-sections'

export type {
  MenuActionItem,
  MenuEntry,
  MenuItem,
  MenuSection,
  MenuSubmenuItem,
} from './menu-sections'

export type MenuAlign = 'start' | 'end'
export type MenuPlacement = FloatingPlacement

export type MenuProps = {
  label: string
  items: MenuEntry[]
  trigger?: ReactNode
  icon?: SymbolName
  isLabelHidden?: boolean
  align?: MenuAlign
  placement?: MenuPlacement
  className?: string
}

export function Menu({
  label,
  items,
  trigger,
  icon,
  align = 'start',
  placement,
  className,
}: MenuProps) {
  const id = useId()
  const menuId = `${id}-menu`
  const submenuRef = useRef<HTMLDivElement>(null)
  const [openWith, setOpenWith] = useState<MenuInitialFocus>()
  const isOpen = openWith !== undefined
  const { anchorRef, floatingRef, setFloating, style, side } = useFloating<
    HTMLDivElement,
    HTMLDivElement
  >({ isOpen, placement: placement ?? `bottom-${align}` })

  function close(shouldRestoreFocus: boolean) {
    setOpenWith(undefined)

    if (shouldRestoreFocus) {
      anchorRef.current?.querySelector('button')?.focus()
    }
  }

  useDismiss({
    isEnabled: isOpen,
    refs: [anchorRef, floatingRef, submenuRef],
    onDismiss: (reason) => close(reason === 'escape'),
  })

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpenWith('first')
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpenWith('last')
    }
  }

  const triggerProps = {
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
    onClick: () => (isOpen ? close(false) : setOpenWith('checked')),
    onKeyDown: handleTriggerKeyDown,
  } as const

  return (
    <div ref={anchorRef} className={className}>
      <button {...triggerProps} type="button" aria-label={label}>
        {trigger ?? (
          <>
            {icon && <span aria-hidden="true">{symbols[icon]} </span>}
            {label}
          </>
        )}
      </button>
      {openWith && (
        <Portal anchorRef={anchorRef}>
          <MenuList
            id={menuId}
            label={label}
            entries={items}
            initialFocus={openWith}
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
