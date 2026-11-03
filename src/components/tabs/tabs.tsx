import type { KeyboardEvent, ReactNode } from 'react'
import { useId, useRef, useState } from 'react'

import { cx } from '@/lib/cx'

import styles from './tabs.module.scss'

export type TabItem = {
  id: string
  label: string
  content: ReactNode
  isDisabled?: boolean
}

export type TabsVariant = 'line' | 'pill'

export type TabsProps = {
  label: string
  items: TabItem[]
  value?: string
  defaultValue?: string
  onChange?: (id: string) => void
  variant?: TabsVariant
  className?: string
}

export function Tabs({
  label,
  items,
  value,
  defaultValue,
  onChange,
  variant = 'line',
  className,
}: TabsProps) {
  const baseId = useId()
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? items.find((item) => !item.isDisabled)?.id,
  )
  const selectedId = value ?? internalValue
  const selectedItem = items.find((item) => item.id === selectedId)
  const enabledItems = items.filter((item) => !item.isDisabled)

  function select(id: string) {
    setInternalValue(id)
    onChange?.(id)
    tabRefs.current.get(id)?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = enabledItems.findIndex((item) => item.id === selectedId)
    const lastIndex = enabledItems.length - 1
    const nextIndex = {
      ArrowRight: index === lastIndex ? 0 : index + 1,
      ArrowLeft: index <= 0 ? lastIndex : index - 1,
      Home: 0,
      End: lastIndex,
    }[event.key]
    const next = nextIndex === undefined ? undefined : enabledItems[nextIndex]

    if (next) {
      event.preventDefault()
      select(next.id)
    }
  }

  return (
    <div className={cx(styles.root, className)}>
      <div
        className={cx(styles.list, styles[variant])}
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => (
          <button
            key={item.id}
            ref={(element) => {
              if (element) {
                tabRefs.current.set(item.id, element)
              } else {
                tabRefs.current.delete(item.id)
              }
            }}
            id={`${baseId}-tab-${item.id}`}
            className={styles.tab}
            type="button"
            role="tab"
            aria-selected={item.id === selectedId}
            aria-controls={`${baseId}-panel-${item.id}`}
            tabIndex={item.id === selectedId ? 0 : -1}
            disabled={item.isDisabled}
            onClick={() => select(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {selectedItem && (
        <div
          id={`${baseId}-panel-${selectedItem.id}`}
          className={styles.panel}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${selectedItem.id}`}
          tabIndex={0}
        >
          {selectedItem.content}
        </div>
      )}
    </div>
  )
}
