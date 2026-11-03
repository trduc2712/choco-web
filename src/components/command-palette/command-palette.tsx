import type { KeyboardEvent, MouseEvent } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import { Kbd } from '@/components/kbd/kbd'
import { cx } from '@/lib/cx'

import styles from './command-palette.module.scss'
import type { CommandPaletteItem } from './filter-commands'
import { filterCommands } from './filter-commands'

export type { CommandPaletteItem } from './filter-commands'

export type CommandPaletteProps = {
  isOpen: boolean
  onClose: () => void
  label: string
  items: CommandPaletteItem[]
  onSelect: (item: CommandPaletteItem) => void
  placeholder?: string
  className?: string
}

export function CommandPalette({
  isOpen,
  onClose,
  label,
  items,
  onSelect,
  placeholder,
  className,
}: CommandPaletteProps) {
  const { t } = useTranslation()
  const id = useId()
  const inputId = `${id}-input`
  const listboxId = `${id}-listbox`
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => filterCommands(items, query), [items, query])

  const groups = useMemo(() => {
    if (query.trim()) {
      return [{ group: undefined, items: results }]
    }

    const byGroup = new Map<string | undefined, CommandPaletteItem[]>()

    for (const item of results) {
      byGroup.set(item.group, [...(byGroup.get(item.group) ?? []), item])
    }

    return [...byGroup].map(([group, groupItems]) => ({
      group,
      items: groupItems,
    }))
  }, [query, results])

  const ordered = groups.flatMap((group) => group.items)
  const activeItem = ordered.at(activeIndex)
  const optionId = (item: CommandPaletteItem) => `${id}-option-${item.id}`

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (isOpen && !dialog.open) {
      setQuery('')
      setActiveIndex(0)
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    if (activeItem) {
      document
        .getElementById(optionId(activeItem))
        ?.scrollIntoView?.({ block: 'nearest' })
    }
  })

  function choose(item: CommandPaletteItem) {
    onClose()
    onSelect(item)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const count = ordered.length

    if (event.key === 'ArrowDown' && count > 0) {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % count)
    } else if (event.key === 'ArrowUp' && count > 0) {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + count) % count)
    } else if (event.key === 'Enter' && activeItem) {
      event.preventDefault()
      choose(activeItem)
    }
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={cx(styles.root, className)}
      aria-label={label}
      onClose={onClose}
      onClick={handleClick}
    >
      <div className={styles.field}>
        <Icon className={styles.icon} name="search" />
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          aria-expanded="true"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeItem ? optionId(activeItem) : undefined}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
        />
        <Kbd className={styles.escape}>{t('commandPalette.escapeKey')}</Kbd>
      </div>
      <div
        id={listboxId}
        className={styles.listbox}
        role="listbox"
        aria-label={t('commandPalette.results')}
      >
        {groups.map(({ group, items: groupItems }, groupIndex) => {
          const options = groupItems.map((item) => (
            <CommandOption
              key={item.id}
              id={optionId(item)}
              item={item}
              isActive={item === activeItem}
              onHover={() => setActiveIndex(ordered.indexOf(item))}
              onSelect={() => choose(item)}
            />
          ))
          const groupId = `${id}-group-${groupIndex}`

          return group ? (
            <div
              key={group}
              className={styles.group}
              role="group"
              aria-labelledby={groupId}
            >
              <div id={groupId} className={styles.groupName} aria-hidden="true">
                {group}
              </div>
              {options}
            </div>
          ) : (
            options
          )
        })}
        {ordered.length === 0 && (
          <p className={styles.empty} role="status">
            {t('commandPalette.empty', { query: query.trim() })}
          </p>
        )}
      </div>
      <div className={styles.footer} aria-hidden="true">
        <span>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          {t('commandPalette.hint')}
        </span>
        <span>
          <Kbd>↵</Kbd>
          {t('commandPalette.select')}
        </span>
        <span>
          <Kbd>{t('commandPalette.escapeKey')}</Kbd>
          {t('commandPalette.close')}
        </span>
      </div>
    </dialog>
  )
}

type CommandOptionProps = {
  id: string
  item: CommandPaletteItem
  isActive: boolean
  onHover: () => void
  onSelect: () => void
}

function CommandOption({
  id,
  item,
  isActive,
  onHover,
  onSelect,
}: CommandOptionProps) {
  return (
    <div
      id={id}
      className={cx(styles.option, isActive && styles.active)}
      role="option"
      aria-selected={isActive}
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={onHover}
      onClick={onSelect}
    >
      {item.icon && (
        <span className={styles.optionIcon}>
          <Icon name={item.icon} size="sm" />
        </span>
      )}
      <span className={styles.optionText}>
        <span className={styles.optionName}>{item.label}</span>
        {item.description && (
          <span className={styles.optionDescription}>{item.description}</span>
        )}
      </span>
      <Icon className={styles.optionArrow} name="arrow-right" size="sm" />
    </div>
  )
}
