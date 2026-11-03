import type { KeyboardEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  formatTimeInput,
  fromMinutes,
  fromTimeString,
  getTimePlaceholder,
  parseTimeInput,
  toMinutes,
  toTimeString,
} from '@/components/calendar/time-format'
import type { InputProps } from '@/components/input/input'
import { Input } from '@/components/input/input'
import { useControllableState } from '@/hooks/use-controllable-state'

export type TimeFieldProps = Omit<
  InputProps,
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'min'
  | 'max'
  | 'step'
  | 'icon'
  | 'trailing'
> & {
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  min?: string
  max?: string
  step?: number
}

export function TimeField({
  value: valueProp,
  defaultValue = null,
  onChange,
  min,
  max,
  step = 15,
  name,
  error,
  disabled,
  readOnly,
  onBlur,
  onKeyDown,
  ...props
}: TimeFieldProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [draft, setDraft] = useState<string>()
  const [inputError, setInputError] = useState<string>()
  const time = value ? fromTimeString(value) : undefined
  const text = draft ?? (time ? formatTimeInput(time, locale) : '')
  const minTime = min ? fromTimeString(min) : undefined
  const maxTime = max ? fromTimeString(max) : undefined

  function isInRange(minutes: number) {
    return (
      (!minTime || minutes >= toMinutes(minTime)) &&
      (!maxTime || minutes <= toMinutes(maxTime))
    )
  }

  function update(next: string | null) {
    setDraft(undefined)
    setInputError(undefined)

    if (next !== value) {
      setValue(next)
    }
  }

  function commit() {
    if (draft === undefined) {
      return
    }

    const parsed = parseTimeInput(draft)

    if (parsed === undefined) {
      setInputError(t('timeField.invalid'))
    } else if (parsed && !isInRange(toMinutes(parsed))) {
      setInputError(
        t('timeField.outOfRange', {
          min: minTime ? formatTimeInput(minTime, locale) : '',
          max: maxTime ? formatTimeInput(maxTime, locale) : '',
        }),
      )
    } else {
      update(parsed ? toTimeString(parsed) : null)
    }
  }

  function stepBy(direction: 1 | -1) {
    const current = time ? toMinutes(time) : direction === 1 ? -step : 0
    // Snap to the step first, so 09:07 moves to 09:15 rather than 09:22.
    const snapped =
      direction === 1
        ? Math.floor(current / step) * step + step
        : Math.ceil(current / step) * step - step
    const next = fromMinutes(snapped)

    if (isInRange(toMinutes(next))) {
      update(toTimeString(next))
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)

    if (disabled || readOnly) {
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      stepBy(event.key === 'ArrowUp' ? 1 : -1)
    } else if (event.key === 'Enter') {
      commit()
    }
  }

  return (
    <>
      <Input
        {...props}
        type="text"
        icon="clock"
        inputMode="text"
        autoComplete="off"
        placeholder={getTimePlaceholder(locale)}
        value={text}
        disabled={disabled}
        readOnly={readOnly}
        error={error ?? inputError}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => {
          onBlur?.(event)
          commit()
        }}
        onKeyDown={handleKeyDown}
      />
      {name && <input type="hidden" name={name} value={value ?? ''} />}
    </>
  )
}
