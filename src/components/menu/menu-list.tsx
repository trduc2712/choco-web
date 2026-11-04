import type { CSSProperties, KeyboardEvent, Ref, RefObject } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/icon/icon'
import { Kbd } from '@/components/kbd/kbd'
import { Portal } from '@/components/portal/portal'
import { useFloating } from '@/hooks/use-floating'
import { cx } from '@/lib/cx'

import styles from './menu.module.scss'
import type {
  MenuActionItem,
  MenuEntry,
  MenuInitialFocus,
  MenuItem,
} from './menu-sections'
import { toSections } from './menu-sections'

const TYPEAHEAD_RESET_MS = 500

type MenuListProps = {
  id: string
  label: string
  entries: MenuEntry[]
  initialFocus: MenuInitialFocus
  onClose: (shouldRestoreFocus: boolean) => void
  /** Closes only this list, when it is a submenu, and goes back to its item. */
  onBack?: () => void
  /** Receives the open submenu, so clicks inside it do not dismiss the menu. */
  submenuRef?: RefObject<HTMLDivElement | null>
  listRef?: Ref<HTMLDivElement>
  style?: CSSProperties
  side?: string
  className?: string
}

type OpenSubmenu = { index: number; initialFocus: MenuInitialFocus }

function hasSubmenu(item: MenuItem): item is MenuItem & {
  submenu: MenuActionItem[]
} {
  return item.submenu !== undefined
}

export function MenuList({
  id,
  label,
  entries,
  initialFocus,
  onClose,
  onBack,
  submenuRef,
  listRef,
  style,
  side,
  className,
}: MenuListProps) {
  const sections = toSections(entries)
  const items = sections.flatMap((section) => section.items)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const typeahead = useRef({ query: '', time: 0 })
  const enabledIndexes = items.flatMap((item, index) =>
    item.isDisabled ? [] : [index],
  )
  const [focusIndex, setFocusIndex] = useState(() => {
    if (initialFocus === 'none') {
      return undefined
    }

    const checkedIndex = items.findIndex(
      (item) => item.isChecked && !item.isDisabled,
    )

    if (initialFocus === 'checked' && checkedIndex >= 0) {
      return checkedIndex
    }

    return initialFocus === 'last' ? enabledIndexes.at(-1) : enabledIndexes[0]
  })
  const [openSubmenu, setOpenSubmenu] = useState<OpenSubmenu>()
  const submenuItem =
    openSubmenu === undefined ? undefined : items[openSubmenu.index]
  const submenu = useFloating<HTMLButtonElement, HTMLDivElement>({
    isOpen: openSubmenu !== undefined,
    placement: 'right-start',
  })

  useEffect(() => {
    if (focusIndex !== undefined) {
      itemRefs.current[focusIndex]?.focus()
    }
  }, [focusIndex])

  function setSubmenuList(node: HTMLDivElement | null) {
    submenu.setFloating(node)

    if (submenuRef) {
      submenuRef.current = node
    }
  }

  function openSubmenuAt(index: number, focus: MenuInitialFocus) {
    setOpenSubmenu({ index, initialFocus: focus })
  }

  function closeSubmenu() {
    if (openSubmenu === undefined) {
      return
    }

    itemRefs.current[openSubmenu.index]?.focus()
    setOpenSubmenu(undefined)
  }

  function focusByText(key: string) {
    const now = Date.now()
    const query =
      now - typeahead.current.time > TYPEAHEAD_RESET_MS
        ? key
        : typeahead.current.query + key
    typeahead.current = { query, time: now }

    const start = enabledIndexes.indexOf(focusIndex ?? -1)
    const ordered = [
      ...enabledIndexes.slice(start + 1),
      ...enabledIndexes.slice(0, start + 1),
    ]
    const match = ordered.find((index) =>
      items[index].label.toLocaleLowerCase().startsWith(query),
    )

    if (match !== undefined) {
      setFocusIndex(match)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Keys pressed in a submenu reach this list through the React tree.
    if (
      !(event.target instanceof Node) ||
      !event.currentTarget.contains(event.target)
    ) {
      return
    }

    const position = enabledIndexes.indexOf(focusIndex ?? -1)
    const lastPosition = enabledIndexes.length - 1
    const nextPosition = {
      ArrowDown: position === lastPosition ? 0 : position + 1,
      ArrowUp: position <= 0 ? lastPosition : position - 1,
      Home: 0,
      End: lastPosition,
    }[event.key]
    const focusedItem = focusIndex === undefined ? undefined : items[focusIndex]

    if (nextPosition !== undefined) {
      event.preventDefault()
      setFocusIndex(enabledIndexes[nextPosition])
    } else if (
      event.key === 'ArrowRight' &&
      focusIndex !== undefined &&
      focusedItem &&
      hasSubmenu(focusedItem) &&
      !focusedItem.isDisabled
    ) {
      event.preventDefault()
      openSubmenuAt(focusIndex, 'checked')
    } else if (event.key === 'ArrowLeft' && onBack) {
      event.preventDefault()
      onBack()
    } else if (event.key === 'Escape') {
      event.preventDefault()

      if (onBack) {
        onBack()
      } else {
        onClose(true)
      }
    } else if (event.key === 'Tab') {
      onClose(false)
    } else if (
      event.key.length === 1 &&
      event.key !== ' ' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      focusByText(event.key.toLocaleLowerCase())
    }
  }

  function select(item: MenuItem, index: number) {
    if (item.isDisabled) {
      return
    }

    if (hasSubmenu(item)) {
      openSubmenuAt(index, 'checked')
      return
    }

    onClose(true)
    item.onSelect?.()
  }

  function hover(item: MenuItem, index: number) {
    if (item.isDisabled) {
      return
    }

    if (focusIndex !== index) {
      setFocusIndex(index)
    }

    if (hasSubmenu(item)) {
      if (openSubmenu?.index !== index) {
        openSubmenuAt(index, 'none')
      }
    } else if (openSubmenu !== undefined) {
      setOpenSubmenu(undefined)
    }
  }

  const sectionOffsets = sections.map((_, sectionIndex) =>
    sections
      .slice(0, sectionIndex)
      .reduce((total, section) => total + section.items.length, 0),
  )

  return (
    <div
      ref={listRef}
      id={id}
      className={cx(styles.list, className)}
      style={style}
      role="menu"
      aria-label={label}
      data-side={side}
      onKeyDown={handleKeyDown}
    >
      {sections.map((section, sectionIndex) => {
        const content = section.items.map((item, indexInSection) => {
          const index = sectionOffsets[sectionIndex] + indexInSection
          const isSubmenuOpen = openSubmenu?.index === index
          const submenuId = `${id}-${item.id}-submenu`

          return (
            <button
              key={item.id}
              ref={(element) => {
                itemRefs.current[index] = element

                if (isSubmenuOpen) {
                  submenu.anchorRef.current = element
                }
              }}
              className={cx(
                styles.item,
                item.tone === 'danger' && styles.danger,
              )}
              type="button"
              role={item.isChecked === undefined ? 'menuitem' : 'menuitemradio'}
              tabIndex={-1}
              aria-checked={item.isChecked}
              aria-disabled={item.isDisabled || undefined}
              aria-keyshortcuts={item.shortcut}
              aria-haspopup={hasSubmenu(item) ? 'menu' : undefined}
              aria-expanded={hasSubmenu(item) ? isSubmenuOpen : undefined}
              aria-controls={isSubmenuOpen ? submenuId : undefined}
              onClick={() => select(item, index)}
              onMouseMove={() => hover(item, index)}
            >
              {item.icon && <Icon name={item.icon} size="sm" />}
              <span className={styles.label}>{item.label}</span>
              {item.value && <span className={styles.value}>{item.value}</span>}
              {item.shortcut && (
                <Kbd className={styles.shortcut} aria-hidden="true">
                  {item.shortcut}
                </Kbd>
              )}
              {item.isChecked !== undefined && (
                <Icon
                  className={cx(styles.check, item.isChecked && styles.checked)}
                  name="check"
                  size="sm"
                />
              )}
              {hasSubmenu(item) && (
                <Icon
                  className={styles.chevron}
                  name="chevron-right"
                  size="sm"
                />
              )}
            </button>
          )
        })

        return (
          <Fragment key={section.id}>
            {sectionIndex > 0 && (
              <div className={styles.separator} role="separator" />
            )}
            {section.label ? (
              <div role="group" aria-labelledby={`${id}-${section.id}`}>
                <div
                  id={`${id}-${section.id}`}
                  className={styles.sectionLabel}
                  aria-hidden="true"
                >
                  {section.label}
                </div>
                {content}
              </div>
            ) : (
              content
            )}
          </Fragment>
        )
      })}
      {openSubmenu && submenuItem && hasSubmenu(submenuItem) && (
        <Portal anchorRef={submenu.anchorRef}>
          <MenuList
            key={`${submenuItem.id}-${openSubmenu.initialFocus}`}
            id={`${id}-${submenuItem.id}-submenu`}
            label={submenuItem.label}
            entries={submenuItem.submenu}
            initialFocus={openSubmenu.initialFocus}
            listRef={setSubmenuList}
            style={submenu.style}
            side={submenu.side}
            onClose={onClose}
            onBack={closeSubmenu}
          />
        </Portal>
      )}
    </div>
  )
}
