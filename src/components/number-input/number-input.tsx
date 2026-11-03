import type { KeyboardEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import type { InputProps } from '@/components/input/input'
import { Input } from '@/components/input/input'
import { useControllableState } from '@/hooks/use-controllable-state'

export type NumberInputProps = Omit<
  InputProps,
  | 'type'
  | 'trailing'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'min'
  | 'max'
  | 'step'
> & {
  value?: number | null
  defaultValue?: number | null
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  formatOptions?: Intl.NumberFormatOptions
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function roundToStep(value: number, step: number) {
  const decimals = (String(step).split('.')[1] ?? '').length

  return Number(value.toFixed(decimals))
}

export function NumberInput({
  value: valueProp,
  defaultValue = null,
  onChange,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  formatOptions,
  disabled,
  readOnly,
  onBlur,
  onKeyDown,
  ...props
}: NumberInputProps) {
  const { t, i18n } = useTranslation()
  const [value, setValue] = useControllableState<number | null>({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [draft, setDraft] = useState<string>()
  const formatter = new Intl.NumberFormat(i18n.resolvedLanguage, {
    useGrouping: false,
    maximumFractionDigits: 20,
    ...formatOptions,
  })
  const text = draft ?? (value === null ? '' : formatter.format(value))
  const isLocked = disabled || readOnly

  function commit(next: number | null) {
    setDraft(undefined)
    setValue(next === null ? null : clamp(roundToStep(next, step), min, max))
  }

  function stepBy(direction: 1 | -1, multiplier = 1) {
    const base = value ?? (min > Number.MIN_SAFE_INTEGER ? min : 0)
    commit(base + direction * step * multiplier)
  }

  function parse(input: string): number | null {
    const normalized = input.replace(/[^\d.,-]/g, '').replace(',', '.')

    if (!normalized) {
      return null
    }

    const parsed = Number(normalized)

    return Number.isFinite(parsed) ? parsed : value
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)

    if (isLocked) {
      return
    }

    const action = {
      ArrowUp: () => stepBy(1, event.shiftKey ? 10 : 1),
      ArrowDown: () => stepBy(-1, event.shiftKey ? 10 : 1),
      PageUp: () => stepBy(1, 10),
      PageDown: () => stepBy(-1, 10),
      Home: () => min > Number.MIN_SAFE_INTEGER && commit(min),
      End: () => max < Number.MAX_SAFE_INTEGER && commit(max),
      Enter: () => commit(parse(text)),
    }[event.key]

    if (action) {
      event.preventDefault()
      action()
    }
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      role="spinbutton"
      autoComplete="off"
      value={text}
      disabled={disabled}
      readOnly={readOnly}
      aria-valuenow={value ?? undefined}
      aria-valuemin={min > Number.MIN_SAFE_INTEGER ? min : undefined}
      aria-valuemax={max < Number.MAX_SAFE_INTEGER ? max : undefined}
      aria-valuetext={value === null ? undefined : text}
      trailing={
        <>
          <Button
            icon="minus"
            variant="ghost"
            size="sm"
            tabIndex={-1}
            disabled={isLocked || (value !== null && value <= min)}
            aria-label={t('numberInput.decrement')}
            onClick={() => stepBy(-1)}
          />
          <Button
            icon="plus"
            variant="ghost"
            size="sm"
            tabIndex={-1}
            disabled={isLocked || (value !== null && value >= max)}
            aria-label={t('numberInput.increment')}
            onClick={() => stepBy(1)}
          />
        </>
      }
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => {
        onBlur?.(event)

        if (draft !== undefined) {
          commit(parse(draft))
        }
      }}
      onKeyDown={handleKeyDown}
    />
  )
}
