import type { KeyboardEvent, ReactNode } from 'react'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Calendar } from '@/components/calendar/calendar'
import {
  formatDateInput,
  getDatePlaceholder,
  parseDateInput,
} from '@/components/calendar/date-format'
import type { DateRange } from '@/components/calendar/date-utils'
import {
  isSameDay,
  startOfDay,
  toDateKey,
} from '@/components/calendar/date-utils'
import type { TimeValue } from '@/components/calendar/time-format'
import {
  formatTimeInput,
  fromMinutes,
  fromTimeString,
  getTimePlaceholder,
  parseTimeInput,
  toMinutes,
  toTimeString,
} from '@/components/calendar/time-format'
import { Field } from '@/components/field/field'
import { getDescribedBy } from '@/components/field/field-ids'
import type { PopoverPlacement } from '@/components/popover/popover'
import { Popover } from '@/components/popover/popover'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './date-picker.module.scss'

export type DateRangePreset = {
  id: string
  label: string
  range: DateRange
}

type DatePickerBaseProps = {
  label: string
  hint?: string
  error?: string
  min?: Date
  max?: Date
  isDateDisabled?: (date: Date) => boolean
  isDisabled?: boolean
  isReadOnly?: boolean
  isRequired?: boolean
  isClearable?: boolean
  placement?: PopoverPlacement
  isOpen?: boolean
  defaultOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  className?: string
}

export type DatePickerProps = DatePickerBaseProps & {
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (date: Date | null) => void
  name?: string
  hasTodayButton?: boolean
}

export type DateRangePickerProps = DatePickerBaseProps & {
  value?: DateRange | null
  defaultValue?: DateRange | null
  onChange?: (range: DateRange | null) => void
  startName?: string
  endName?: string
  presets?: DateRangePreset[]
  numberOfMonths?: 1 | 2
}

type InputError =
  'invalid' | 'unavailable' | 'order' | 'invalidTime' | 'missingTime'

function useAvailability({
  min,
  max,
  isDateDisabled,
}: Pick<DatePickerBaseProps, 'min' | 'max' | 'isDateDisabled'>) {
  return (date: Date) =>
    !(
      (min !== undefined && date < startOfDay(min)) ||
      (max !== undefined && date > startOfDay(max)) ||
      (isDateDisabled?.(date) ?? false)
    )
}

type PickerShellProps = DatePickerBaseProps & {
  inputId: string
  shownError: string | undefined
  hasValue: boolean
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onClear: () => void
  inputs: ReactNode
  hiddenInputs: ReactNode
  children: ReactNode
}

function PickerShell({
  inputId,
  label,
  hint,
  shownError,
  isDisabled = false,
  isReadOnly = false,
  isRequired = false,
  isClearable = true,
  placement = 'bottom-start',
  hasValue,
  isOpen,
  onOpenChange,
  onClear,
  inputs,
  hiddenInputs,
  className,
  children,
}: PickerShellProps) {
  const { t } = useTranslation()
  const isLocked = isDisabled || isReadOnly

  return (
    <Field
      id={inputId}
      label={label}
      hint={hint}
      error={shownError}
      isRequired={isRequired}
      className={className}
    >
      <div
        className={cx(
          styles.control,
          shownError && styles.invalid,
          isDisabled && styles.disabled,
        )}
      >
        {inputs}
        {isClearable && hasValue && !isLocked && (
          <Button
            icon="close"
            variant="ghost"
            size="sm"
            aria-label={t('datePicker.clear')}
            onClick={onClear}
          />
        )}
        <Popover
          label={label}
          placement={placement}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          className={styles.popover}
          trigger={
            <Button
              icon="calendar"
              variant="ghost"
              size="sm"
              disabled={isLocked}
              aria-label={t('datePicker.open', { label })}
            />
          }
        >
          {children}
        </Popover>
      </div>
      {hiddenInputs}
    </Field>
  )
}

export function DatePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  name,
  hasTodayButton = true,
  min,
  max,
  isDateDisabled,
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: DatePickerProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const isAvailable = useAvailability({ min, max, isDateDisabled })
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [isOpen, setIsOpen] = useControllableState({
    value: isOpenProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const [draft, setDraft] = useState<string>()
  const [inputError, setInputError] = useState<InputError>()
  const text = draft ?? (value ? formatDateInput(value, locale) : '')
  const shownError =
    props.error ?? (inputError && t(`datePicker.${inputError}`))
  const today = startOfDay(new Date())

  function update(next: Date | null) {
    setDraft(undefined)
    setInputError(undefined)

    if (next?.getTime() !== value?.getTime()) {
      setValue(next)
    }
  }

  function commit() {
    if (draft === undefined) {
      return
    }

    const parsed = parseDateInput(draft, locale)

    if (parsed === undefined) {
      setInputError('invalid')
    } else if (parsed && !isAvailable(parsed)) {
      setInputError('unavailable')
    } else {
      update(parsed)
    }
  }

  function pick(date: Date) {
    update(date)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      commit()
    } else if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  return (
    <PickerShell
      {...props}
      inputId={inputId}
      shownError={shownError}
      hasValue={value !== null || Boolean(draft)}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onClear={() => {
        update(null)
        inputRef.current?.focus()
      }}
      inputs={
        <input
          ref={inputRef}
          id={inputId}
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={getDatePlaceholder(locale)}
          value={text}
          disabled={props.isDisabled}
          readOnly={props.isReadOnly}
          required={props.isRequired}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={getDescribedBy(inputId, props.hint, shownError)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      }
      hiddenInputs={
        name && (
          <input
            type="hidden"
            name={name}
            value={value ? toDateKey(value) : ''}
          />
        )
      }
    >
      <Calendar
        value={value}
        min={min}
        max={max}
        isDateDisabled={isDateDisabled}
        autoFocus
        onChange={pick}
        footer={
          (hasTodayButton || value) && (
            <>
              {hasTodayButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    !isAvailable(today) || isSameDay(today, value ?? undefined)
                  }
                  onClick={() => pick(today)}
                >
                  {t('datePicker.today')}
                </Button>
              )}
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    update(null)
                    setIsOpen(false)
                    inputRef.current?.focus()
                  }}
                >
                  {t('datePicker.clear')}
                </Button>
              )}
            </>
          )
        }
      />
    </PickerShell>
  )
}

export function DateRangePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  startName,
  endName,
  presets,
  numberOfMonths = 2,
  min,
  max,
  isDateDisabled,
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: DateRangePickerProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const startId = useId()
  const startRef = useRef<HTMLInputElement>(null)
  const isAvailable = useAvailability({ min, max, isDateDisabled })
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [isOpen, setIsOpen] = useControllableState({
    value: isOpenProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const [drafts, setDrafts] = useState<{ start?: string; end?: string }>({})
  const [inputError, setInputError] = useState<InputError>()
  const startText =
    drafts.start ?? (value ? formatDateInput(value.start, locale) : '')
  const endText =
    drafts.end ?? (value ? formatDateInput(value.end, locale) : '')
  const shownError =
    props.error ?? (inputError && t(`datePicker.${inputError}`))
  const placeholder = getDatePlaceholder(locale)

  function update(next: DateRange | null) {
    setDrafts({})
    setInputError(undefined)

    const isSame =
      next?.start.getTime() === value?.start.getTime() &&
      next?.end.getTime() === value?.end.getTime()

    if (!isSame) {
      setValue(next)
    }
  }

  function commit() {
    if (drafts.start === undefined && drafts.end === undefined) {
      return
    }

    const start = parseDateInput(startText, locale)
    const end = parseDateInput(endText, locale)

    if (start === undefined || end === undefined) {
      setInputError('invalid')
    } else if (start === null && end === null) {
      update(null)
    } else if (start === null || end === null) {
      // Wait for the other half of the range before judging it.
      setInputError(undefined)
    } else if (!isAvailable(start) || !isAvailable(end)) {
      setInputError('unavailable')
    } else if (end < start) {
      setInputError('order')
    } else {
      update({ start, end })
    }
  }

  function pick(range: DateRange) {
    update(range)
    setIsOpen(false)
    startRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      commit()
    } else if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  const inputProps = {
    className: styles.input,
    type: 'text',
    inputMode: 'numeric',
    autoComplete: 'off',
    placeholder,
    disabled: props.isDisabled,
    readOnly: props.isReadOnly,
    required: props.isRequired,
    'aria-invalid': shownError ? true : undefined,
    'aria-describedby': getDescribedBy(startId, props.hint, shownError),
    onBlur: commit,
    onKeyDown: handleKeyDown,
  } as const

  return (
    <PickerShell
      {...props}
      inputId={startId}
      shownError={shownError}
      hasValue={value !== null || Boolean(drafts.start || drafts.end)}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onClear={() => {
        update(null)
        startRef.current?.focus()
      }}
      inputs={
        <>
          <input
            {...inputProps}
            ref={startRef}
            id={startId}
            aria-label={t('datePicker.start', { label: props.label })}
            value={startText}
            onChange={(event) =>
              setDrafts((current) => ({
                ...current,
                start: event.target.value,
              }))
            }
          />
          <span className={styles.separator} aria-hidden="true">
            –
          </span>
          <input
            {...inputProps}
            aria-label={t('datePicker.end', { label: props.label })}
            value={endText}
            onChange={(event) =>
              setDrafts((current) => ({ ...current, end: event.target.value }))
            }
          />
        </>
      }
      hiddenInputs={
        <>
          {startName && (
            <input
              type="hidden"
              name={startName}
              value={value ? toDateKey(value.start) : ''}
            />
          )}
          {endName && (
            <input
              type="hidden"
              name={endName}
              value={value ? toDateKey(value.end) : ''}
            />
          )}
        </>
      }
    >
      <div className={styles.rangeLayout}>
        {presets && presets.length > 0 && (
          <div
            className={styles.presets}
            role="group"
            aria-label={t('datePicker.presets')}
          >
            {presets.map((preset) => (
              <Button
                key={preset.id}
                className={styles.preset}
                variant="ghost"
                size="sm"
                aria-pressed={
                  value !== null &&
                  isSameDay(value.start, preset.range.start) &&
                  isSameDay(value.end, preset.range.end)
                }
                onClick={() => pick(preset.range)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}
        <Calendar
          mode="range"
          value={value}
          min={min}
          max={max}
          isDateDisabled={isDateDisabled}
          numberOfMonths={numberOfMonths}
          autoFocus
          onChange={pick}
        />
      </div>
    </PickerShell>
  )
}

export type DateTimePickerProps = DatePickerBaseProps & {
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (value: Date | null) => void
  name?: string
  defaultTime?: string
  timeStep?: number
}

function withTime(date: Date, time: TimeValue): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
  )
}

export function DateTimePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  name,
  defaultTime = '00:00',
  timeStep = 15,
  min,
  max,
  isDateDisabled,
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: DateTimePickerProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const dateId = useId()
  const dateRef = useRef<HTMLInputElement>(null)
  const isAvailable = useAvailability({ min, max, isDateDisabled })
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [isOpen, setIsOpen] = useControllableState({
    value: isOpenProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const [drafts, setDrafts] = useState<{ date?: string; time?: string }>({})
  const [inputError, setInputError] = useState<InputError>()
  const valueTime = value
    ? { hours: value.getHours(), minutes: value.getMinutes() }
    : undefined
  const dateText = drafts.date ?? (value ? formatDateInput(value, locale) : '')
  const timeText =
    drafts.time ?? (valueTime ? formatTimeInput(valueTime, locale) : '')
  const shownError =
    props.error ?? (inputError && t(`datePicker.${inputError}`))

  function update(next: Date | null) {
    setDrafts({})
    setInputError(undefined)

    if (next?.getTime() !== value?.getTime()) {
      setValue(next)
    }
  }

  function commit() {
    if (drafts.date === undefined && drafts.time === undefined) {
      return
    }

    const date = parseDateInput(dateText, locale)
    const time = parseTimeInput(timeText)

    if (date === undefined) {
      setInputError('invalid')
    } else if (time === undefined) {
      setInputError('invalidTime')
    } else if (date === null && time === null) {
      update(null)
    } else if (date === null) {
      // A time on its own waits for its date.
      setInputError(undefined)
    } else if (time === null) {
      setInputError('missingTime')
    } else if (!isAvailable(date)) {
      setInputError('unavailable')
    } else {
      update(withTime(date, time))
    }
  }

  function pick(date: Date) {
    const typedTime = parseTimeInput(timeText)
    const time =
      typedTime ?? valueTime ?? fromTimeString(defaultTime) ?? fromMinutes(0)
    update(withTime(date, time))
    setIsOpen(false)
    dateRef.current?.focus()
  }

  function stepTime(direction: 1 | -1) {
    const current = parseTimeInput(timeText) ?? valueTime
    const minutes = current ? toMinutes(current) : 0
    const snapped =
      direction === 1
        ? Math.floor(minutes / timeStep) * timeStep + timeStep
        : Math.ceil(minutes / timeStep) * timeStep - timeStep
    const next = fromMinutes(snapped)

    setDrafts((current) => ({
      ...current,
      time: formatTimeInput(next, locale),
    }))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      commit()
    } else if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  const sharedProps = {
    className: styles.input,
    type: 'text',
    autoComplete: 'off',
    disabled: props.isDisabled,
    readOnly: props.isReadOnly,
    required: props.isRequired,
    'aria-invalid': shownError ? true : undefined,
    'aria-describedby': getDescribedBy(dateId, props.hint, shownError),
    onBlur: commit,
  } as const

  return (
    <PickerShell
      {...props}
      inputId={dateId}
      shownError={shownError}
      hasValue={value !== null || Boolean(drafts.date || drafts.time)}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onClear={() => {
        update(null)
        dateRef.current?.focus()
      }}
      inputs={
        <>
          <input
            {...sharedProps}
            ref={dateRef}
            id={dateId}
            inputMode="numeric"
            placeholder={getDatePlaceholder(locale)}
            value={dateText}
            onChange={(event) =>
              setDrafts((current) => ({ ...current, date: event.target.value }))
            }
            onKeyDown={handleKeyDown}
          />
          <input
            {...sharedProps}
            className={cx(styles.input, styles.time)}
            aria-label={t('datePicker.time', { label: props.label })}
            placeholder={getTimePlaceholder(locale)}
            value={timeText}
            onChange={(event) =>
              setDrafts((current) => ({ ...current, time: event.target.value }))
            }
            onKeyDown={(event) => {
              if (
                !props.isReadOnly &&
                (event.key === 'ArrowUp' || event.key === 'ArrowDown')
              ) {
                event.preventDefault()
                stepTime(event.key === 'ArrowUp' ? 1 : -1)
              } else {
                handleKeyDown(event)
              }
            }}
          />
        </>
      }
      hiddenInputs={
        name && (
          <input
            type="hidden"
            name={name}
            value={
              value && valueTime
                ? `${toDateKey(value)}T${toTimeString(valueTime)}`
                : ''
            }
          />
        )
      }
    >
      <Calendar
        value={value}
        min={min}
        max={max}
        isDateDisabled={isDateDisabled}
        autoFocus
        onChange={pick}
      />
    </PickerShell>
  )
}
