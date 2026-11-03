import type { KeyboardEvent } from 'react'
import { useId, useState } from 'react'

import type { ButtonSize, ButtonVariant } from '@/components/button/button'
import { Button } from '@/components/button/button'
import type { IconName } from '@/components/icon/icon-paths'
import { Portal } from '@/components/portal/portal'
import { useDismiss } from '@/hooks/use-dismiss'
import type { FloatingPlacement } from '@/hooks/use-floating'
import { useFloating } from '@/hooks/use-floating'
import { cx } from '@/lib/cx'

import styles from './menu.module.scss'
import { MenuList } from './menu-list'
import type { MenuEntry, MenuInitialFocus } from './menu-sections'

export type { MenuEntry, MenuItem, MenuSection } from './menu-sections'

export type MenuAlign = 'start' | 'end'
export type MenuPlacement = FloatingPlacement

export type MenuProps = {
  label: string
  items: MenuEntry[]
  icon?: IconName
  isLabelHidden?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  align?: MenuAlign
  placement?: MenuPlacement
  className?: string
}

export function Menu({
  label,
  items,
  icon,
  isLabelHidden = false,
  variant = 'secondary',
  size = 'md',
  align = 'start',
  placement,
  className,
}: MenuProps) {
  const id = useId()
  const menuId = `${id}-menu`
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
    refs: [anchorRef, floatingRef],
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
    variant,
    size,
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
    onClick: () => (isOpen ? close(false) : setOpenWith('checked')),
    onKeyDown: handleTriggerKeyDown,
  } as const

  return (
    <div ref={anchorRef} className={cx(styles.root, className)}>
      {isLabelHidden && icon ? (
        <Button {...triggerProps} icon={icon} aria-label={label} />
      ) : (
        <Button {...triggerProps} iconStart={icon} iconEnd="chevron-down">
          {label}
        </Button>
      )}
      {openWith && (
        <Portal anchorRef={anchorRef}>
          <MenuList
            id={menuId}
            label={label}
            entries={items}
            initialFocus={openWith}
            listRef={setFloating}
            style={style}
            side={side}
            onClose={close}
          />
        </Portal>
      )}
    </div>
  )
}
