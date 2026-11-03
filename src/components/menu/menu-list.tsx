import type { CSSProperties, KeyboardEvent, Ref } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/icon/icon'
import { Kbd } from '@/components/kbd/kbd'
import { cx } from '@/lib/cx'

import styles from './menu.module.scss'
import type { MenuEntry, MenuInitialFocus, MenuItem } from './menu-sections'
import { toSections } from './menu-sections'

const TYPEAHEAD_RESET_MS = 500

type MenuListProps = {
  id: string
  label: string
  entries: MenuEntry[]
  initialFocus: MenuInitialFocus
  onClose: (shouldRestoreFocus: boolean) => void
  listRef?: Ref<HTMLDivElement>
  style?: CSSProperties
  side?: string
  className?: string
}

export function MenuList({
  id,
  label,
  entries,
  initialFocus,
  onClose,
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
    const checkedIndex = items.findIndex(
      (item) => item.isChecked && !item.isDisabled,
    )

    if (initialFocus === 'checked' && checkedIndex >= 0) {
      return checkedIndex
    }

    return initialFocus === 'last' ? enabledIndexes.at(-1) : enabledIndexes[0]
  })

  useEffect(() => {
    if (focusIndex !== undefined) {
      itemRefs.current[focusIndex]?.focus()
    }
  }, [focusIndex])

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
    const position = enabledIndexes.indexOf(focusIndex ?? -1)
    const lastPosition = enabledIndexes.length - 1
    const nextPosition = {
      ArrowDown: position === lastPosition ? 0 : position + 1,
      ArrowUp: position <= 0 ? lastPosition : position - 1,
      Home: 0,
      End: lastPosition,
    }[event.key]

    if (nextPosition !== undefined) {
      event.preventDefault()
      setFocusIndex(enabledIndexes[nextPosition])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose(true)
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

  function select(item: MenuItem) {
    if (item.isDisabled) {
      return
    }

    onClose(true)
    item.onSelect()
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

          return (
            <button
              key={item.id}
              ref={(element) => {
                itemRefs.current[index] = element
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
              onClick={() => select(item)}
              onMouseMove={() => {
                if (!item.isDisabled && focusIndex !== index) {
                  setFocusIndex(index)
                }
              }}
            >
              {item.icon && <Icon name={item.icon} size="sm" />}
              <span className={styles.label}>{item.label}</span>
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
    </div>
  )
}
