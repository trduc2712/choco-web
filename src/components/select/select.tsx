import type { KeyboardEvent } from 'react'
import { useEffect, useId, useRef, useState } from 'react'

import { Field } from '@/components/field/field'
import { getDescribedBy } from '@/components/field/field-ids'
import { Icon } from '@/components/icon/icon'
import { cx } from '@/lib/cx'

import styles from './select.module.scss'

const TYPEAHEAD_RESET_MS = 500

export type SelectSize = 'sm' | 'md' | 'lg'

export type SelectOption = {
  value: string
  label: string
  isDisabled?: boolean
}

export type SelectProps = {
  label: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string
  size?: SelectSize
  name?: string
  id?: string
  isLabelHidden?: boolean
  isDisabled?: boolean
  isRequired?: boolean
  className?: string
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  hint,
  error,
  size = 'md',
  name,
  id,
  isLabelHidden,
  isDisabled = false,
  isRequired = false,
  className,
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listboxId = `${selectId}-listbox`
  const typeaheadQuery = useRef('')
  const typeaheadTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const selectedValue = value ?? internalValue
  const selectedIndex = options.findIndex(
    (option) => option.value === selectedValue,
  )
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const enabledIndexes = options.flatMap((option, index) =>
    option.isDisabled ? [] : [index],
  )
  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${selectId}-option-${activeIndex}` : undefined

  useEffect(() => {
    if (activeOptionId) {
      document
        .getElementById(activeOptionId)
        ?.scrollIntoView?.({ block: 'nearest' })
    }
  }, [activeOptionId])

  useEffect(() => () => clearTimeout(typeaheadTimeout.current), [])

  function open(index?: number) {
    const fallback = selectedIndex >= 0 ? selectedIndex : enabledIndexes.at(0)

    setActiveIndex(index ?? fallback ?? -1)
    setIsOpen(true)
  }

  function select(index: number) {
    const option = index >= 0 ? options[index] : undefined

    if (!option || option.isDisabled) {
      return
    }

    setInternalValue(option.value)
    onChange?.(option.value)
    setIsOpen(false)
  }

  function move(step: number) {
    const position = enabledIndexes.indexOf(activeIndex)
    const nextPosition = Math.min(
      Math.max(position + step, 0),
      enabledIndexes.length - 1,
    )

    setActiveIndex(enabledIndexes.at(nextPosition) ?? -1)
  }

  function search(character: string) {
    clearTimeout(typeaheadTimeout.current)
    typeaheadQuery.current += character.toLowerCase()
    typeaheadTimeout.current = setTimeout(() => {
      typeaheadQuery.current = ''
    }, TYPEAHEAD_RESET_MS)

    const match = enabledIndexes.find((index) =>
      options[index].label.toLowerCase().startsWith(typeaheadQuery.current),
    )

    if (match !== undefined) {
      open(match)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (isOpen) {
          move(1)
        } else {
          open()
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (isOpen) {
          move(-1)
        } else {
          open()
        }
        break
      case 'Home':
        event.preventDefault()
        open(enabledIndexes.at(0))
        break
      case 'End':
        event.preventDefault()
        open(enabledIndexes.at(-1))
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (isOpen) {
          select(activeIndex)
        } else {
          open()
        }
        break
      case 'Escape':
        if (isOpen) {
          event.preventDefault()
          setIsOpen(false)
        }
        break
      case 'Tab':
        setIsOpen(false)
        break
      default:
        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          search(event.key)
        }
    }
  }

  return (
    <Field
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      isRequired={isRequired}
      isLabelHidden={isLabelHidden}
      className={className}
    >
      <div className={styles.control}>
        <button
          id={selectId}
          className={cx(styles.trigger, styles[size])}
          type="button"
          role="combobox"
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          aria-required={isRequired || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={getDescribedBy(selectId, hint, error)}
          onClick={() => (isOpen ? setIsOpen(false) : open())}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
        >
          <span
            className={cx(styles.value, !selectedOption && styles.placeholder)}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <Icon className={styles.chevron} name="chevron-down" />
        </button>
        {name && <input type="hidden" name={name} value={selectedValue} />}
        {isOpen && (
          <div className={styles.popup}>
            <ul
              id={listboxId}
              className={styles.listbox}
              role="listbox"
              aria-label={label}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  id={`${selectId}-option-${index}`}
                  className={cx(
                    styles.option,
                    index === activeIndex && styles.active,
                  )}
                  role="option"
                  aria-selected={index === selectedIndex}
                  aria-disabled={option.isDisabled || undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => {
                    if (!option.isDisabled) {
                      setActiveIndex(index)
                    }
                  }}
                  onClick={() => select(index)}
                >
                  {option.label}
                  {index === selectedIndex && <Icon name="check" size="sm" />}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Field>
  )
}
