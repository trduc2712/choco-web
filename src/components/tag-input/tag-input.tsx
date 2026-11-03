import type { KeyboardEvent } from 'react'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Field } from '@/components/field/field'
import { getDescribedBy } from '@/components/field/field-ids'
import { Tag } from '@/components/tag/tag'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './tag-input.module.scss'

export type TagInputProps = {
  label: string
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  suggestions?: string[]
  placeholder?: string
  hint?: string
  error?: string
  maxTags?: number
  isDisabled?: boolean
  isRequired?: boolean
  className?: string
}

const SEPARATORS = ['Enter', ',']

export function TagInput({
  label,
  value: valueProp,
  defaultValue = [],
  onChange,
  suggestions,
  placeholder,
  hint,
  error,
  maxTags = Number.POSITIVE_INFINITY,
  isDisabled = false,
  isRequired = false,
  className,
}: TagInputProps) {
  const { t } = useTranslation()
  const id = useId()
  const instructionsId = `${id}-instructions`
  const listId = `${id}-suggestions`
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [tags, setTags] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const isFull = tags.length >= maxTags

  function add(text: string) {
    const tag = text.trim()

    if (!tag || isFull) {
      return
    }

    const isDuplicate = tags.some(
      (existing) => existing.toLocaleLowerCase() === tag.toLocaleLowerCase(),
    )

    if (!isDuplicate) {
      setTags([...tags, tag])
    }

    setDraft('')
  }

  function remove(index: number) {
    setTags(tags.filter((_, tagIndex) => tagIndex !== index))
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (SEPARATORS.includes(event.key) && draft.trim()) {
      event.preventDefault()
      add(draft)
    } else if (event.key === 'Backspace' && !draft && tags.length > 0) {
      event.preventDefault()
      remove(tags.length - 1)
    }
  }

  const describedBy = [getDescribedBy(id, hint, error), instructionsId]
    .filter(Boolean)
    .join(' ')

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      isRequired={isRequired}
      className={className}
    >
      <div
        className={cx(
          styles.control,
          error && styles.invalid,
          isDisabled && styles.disabled,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.length > 0 && (
          <ul className={styles.tags} aria-label={label}>
            {tags.map((tag, index) => (
              <li key={tag}>
                <Tag
                  label={tag}
                  onRemove={isDisabled ? undefined : () => remove(index)}
                />
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          id={id}
          className={styles.input}
          type="text"
          value={draft}
          placeholder={isFull ? undefined : placeholder}
          disabled={isDisabled || isFull}
          list={suggestions ? listId : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
        />
        {suggestions && (
          <datalist id={listId}>
            {suggestions
              .filter((suggestion) => !tags.includes(suggestion))
              .map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
          </datalist>
        )}
      </div>
      <span id={instructionsId} className={styles.instructions}>
        {t('tagInput.instructions')}
      </span>
    </Field>
  )
}
