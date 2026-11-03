import type { ClipboardEvent, KeyboardEvent } from 'react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Fieldset } from '@/components/fieldset/fieldset'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './pin-input.module.scss'

export type PinInputType = 'numeric' | 'alphanumeric'

export type PinInputProps = {
  label: string
  length?: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  type?: PinInputType
  hint?: string
  error?: string
  isMasked?: boolean
  isDisabled?: boolean
  className?: string
}

const PATTERNS: Record<PinInputType, RegExp> = {
  numeric: /^\d$/,
  alphanumeric: /^[\da-z]$/i,
}

export function PinInput({
  label,
  length = 6,
  value: valueProp,
  defaultValue = '',
  onChange,
  onComplete,
  type = 'numeric',
  hint,
  error,
  isMasked = false,
  isDisabled = false,
  className,
}: PinInputProps) {
  const { t } = useTranslation()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const characters = Array.from({ length }, (_, index) => value[index] ?? '')

  function update(next: string[], focusIndex: number) {
    const joined = next.join('').slice(0, length)
    setValue(joined)
    inputRefs.current[Math.min(focusIndex, length - 1)]?.focus()

    if (joined.length === length && next.every(Boolean)) {
      onComplete?.(joined)
    }
  }

  function fill(index: number, text: string) {
    const accepted = [...text].filter((character) =>
      PATTERNS[type].test(character),
    )

    if (accepted.length === 0) {
      return
    }

    const next = [...characters]
    accepted.forEach((character, offset) => {
      if (index + offset < length) {
        next[index + offset] = character
      }
    })
    update(next, index + accepted.length)
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const next = [...characters]
      const target = characters[index] ? index : Math.max(index - 1, 0)
      next[target] = ''
      update(next, target)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      inputRefs.current[Math.max(index - 1, 0)]?.focus()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      inputRefs.current[Math.min(index + 1, length - 1)]?.focus()
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    fill(index, event.clipboardData.getData('text').trim())
  }

  return (
    <Fieldset
      legend={label}
      hint={hint}
      error={error}
      isDisabled={isDisabled}
      className={className}
    >
      <div className={styles.cells}>
        {characters.map((character, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element
            }}
            className={cx(styles.cell, character && styles.filled)}
            type={isMasked ? 'password' : 'text'}
            inputMode={type === 'numeric' ? 'numeric' : 'text'}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={length}
            value={character}
            aria-label={t('pinInput.digit', {
              index: index + 1,
              count: length,
            })}
            aria-invalid={error ? true : undefined}
            onFocus={(event) => event.target.select()}
            onChange={(event) => fill(index, event.target.value.slice(-length))}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
          />
        ))}
      </div>
    </Fieldset>
  )
}
