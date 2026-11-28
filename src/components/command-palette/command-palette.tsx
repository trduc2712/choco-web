import type { KeyboardEvent, MouseEvent } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { symbols } from '@/lib/symbols'

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
      className={className}
      aria-label={label}
      onClose={onClose}
      onClick={handleClick}
    >
      <div>
        <span aria-hidden="true">⚲</span>
        <label htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
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
        <kbd>{t('commandPalette.escapeKey')}</kbd>
      </div>
      <div
        id={listboxId}
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
            <div key={group} role="group" aria-labelledby={groupId}>
              <div id={groupId} aria-hidden="true">
                {group}
              </div>
              {options}
            </div>
          ) : (
            options
          )
        })}
        {ordered.length === 0 && (
          <p role="status">
            {t('commandPalette.empty', { query: query.trim() })}
          </p>
        )}
      </div>
      <div aria-hidden="true">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          {t('commandPalette.hint')}
        </span>
        <span>
          <kbd>↵</kbd>
          {t('commandPalette.select')}
        </span>
        <span>
          <kbd>{t('commandPalette.escapeKey')}</kbd>
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
      role="option"
      aria-selected={isActive}
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={onHover}
      onClick={onSelect}
    >
      {item.icon && (
        <span>
          <span aria-hidden="true">{symbols[item.icon]}</span>
        </span>
      )}
      <span>
        <span>{item.label}</span>
        {item.description && <span>{item.description}</span>}
      </span>
      <span aria-hidden="true">→</span>
    </div>
  )
}
