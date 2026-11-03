import type { KeyboardEvent } from 'react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import { cx } from '@/lib/cx'

import styles from './combobox.module.scss'

export type ComboboxOption = {
  value: string
  label: string
}

export type ComboboxSize = 'sm' | 'md' | 'lg'

export type ComboboxProps = {
  label: string
  options: ComboboxOption[]
  onSelect: (value: string) => void
  placeholder?: string
  isLabelHidden?: boolean
  isDisabled?: boolean
  size?: ComboboxSize
  className?: string
}

export function Combobox({
  label,
  options,
  onSelect,
  placeholder,
  isLabelHidden = false,
  isDisabled = false,
  size = 'md',
  className,
}: ComboboxProps) {
  const { t } = useTranslation()
  const id = useId()
  const inputId = `${id}-input`
  const listboxId = `${id}-listbox`
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const normalizedQuery = query.trim().toLowerCase()
  const matches = options.filter((option) =>
    option.label.toLowerCase().includes(normalizedQuery),
  )
  const isExpanded = isOpen && matches.length > 0
  const activeOption = isExpanded ? matches[activeIndex] : undefined
  const activeOptionId = activeOption
    ? `${id}-option-${activeIndex}`
    : undefined

  useEffect(() => {
    if (activeOptionId) {
      document
        .getElementById(activeOptionId)
        ?.scrollIntoView?.({ block: 'nearest' })
    }
  }, [activeOptionId])

  function select(option: ComboboxOption) {
    onSelect(option.value)
    setQuery('')
    setIsOpen(false)
    setActiveIndex(0)
  }

  function moveActive(step: number) {
    if (!isOpen) {
      setIsOpen(true)
      setActiveIndex(0)
      return
    }

    if (matches.length > 0) {
      setActiveIndex(
        (index) => (index + step + matches.length) % matches.length,
      )
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveActive(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveActive(-1)
        break
      case 'Enter':
        if (activeOption) {
          event.preventDefault()
          select(activeOption)
        }
        break
      case 'Escape':
        if (isOpen) {
          setIsOpen(false)
        } else {
          setQuery('')
        }
        break
    }
  }

  return (
    <div className={cx(styles.root, className)}>
      <label
        htmlFor={inputId}
        className={isLabelHidden ? styles.hiddenLabel : styles.label}
      >
        {label}
      </label>
      <div className={styles.control}>
        <Icon className={styles.icon} name="search" />
        <input
          id={inputId}
          className={cx(styles.input, styles[size])}
          disabled={isDisabled}
          type="text"
          role="combobox"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
            setActiveIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {isExpanded && (
        <div className={styles.popup}>
          <ul
            id={listboxId}
            className={styles.listbox}
            role="listbox"
            aria-label={label}
          >
            {matches.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                className={styles.option}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.empty} role="status">
        {isOpen && matches.length === 0 ? t('combobox.noResults') : null}
      </div>
    </div>
  )
}
