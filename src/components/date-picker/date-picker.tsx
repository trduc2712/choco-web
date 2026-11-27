import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import type { DateRange } from '@/components/calendar/date-utils'
import { isSameDay, toDateKey } from '@/components/calendar/date-utils'
import { toTimeString } from '@/components/calendar/time-format'
import { Field } from '@/components/field/field'
import { getDescribedBy } from '@/components/field/field-ids'
import { useControllableState } from '@/hooks/use-controllable-state'

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
  className?: string
}

export type DatePickerProps = DatePickerBaseProps & {
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (date: Date | null) => void
  name?: string
}

export type DateRangePickerProps = DatePickerBaseProps & {
  value?: DateRange | null
  defaultValue?: DateRange | null
  onChange?: (range: DateRange | null) => void
  startName?: string
  endName?: string
  presets?: DateRangePreset[]
}

export type DateTimePickerProps = DatePickerProps & {
  timeStep?: number
}

function dateInputValue(date: Date): string {
  return toDateKey(date).padStart(10, '0')
}

function localDate(value: string): Date {
  const [dayKey, time = '00:00'] = value.split('T')
  const [year, month, day] = dayKey.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(hours, minutes, 0, 0)

  return date
}

function isAvailable(
  date: Date,
  { min, max, isDateDisabled }: DatePickerBaseProps,
) {
  const day = localDate(dateInputValue(date))

  // Compare calendar days independently of the time on the bounds.
  return (
    Number.isFinite(day.getTime()) &&
    (!min || day >= localDate(dateInputValue(min))) &&
    (!max || day <= localDate(dateInputValue(max))) &&
    !isDateDisabled?.(day)
  )
}

function nativeInputProps(
  props: DatePickerBaseProps,
  id: string,
  error?: string,
) {
  return {
    className: 'date-picker-input',
    disabled: props.isDisabled,
    readOnly: props.isReadOnly,
    required: props.isRequired,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': getDescribedBy(id, props.hint, error),
  } as const
}

type NativeDateFieldProps = DateTimePickerProps & {
  type: 'date' | 'datetime-local'
}

function NativeDateField({
  value: valueProp,
  defaultValue = null,
  onChange,
  name,
  type,
  timeStep,
  ...props
}: NativeDateFieldProps) {
  const { t } = useTranslation()
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [draft, setDraft] = useState<{ source: string; text: string }>()
  const withTime = type === 'datetime-local'
  const dateKey = value ? dateInputValue(value) : ''
  const saved =
    value && withTime
      ? dateKey +
        'T' +
        toTimeString({ hours: value.getHours(), minutes: value.getMinutes() })
      : dateKey
  const text = draft?.source === saved ? draft.text : saved
  const unavailable = text !== '' && !isAvailable(localDate(text), props)
  const error =
    props.error ?? (unavailable ? t('datePicker.unavailable') : undefined)

  function change(nextText: string) {
    const next = nextText ? localDate(nextText) : null
    if (next && !isAvailable(next, props)) {
      setDraft({ source: saved, text: nextText })
      return
    }

    setDraft(undefined)
    if (next?.getTime() !== value?.getTime()) {
      setValue(next)
    }
  }

  const min = props.min ? dateInputValue(props.min) : undefined
  const max = props.max ? dateInputValue(props.max) : undefined

  return (
    <Field
      id={id}
      label={props.label}
      hint={props.hint}
      error={error}
      isRequired={props.isRequired}
      className={props.className}
    >
      <div className="date-picker-fields">
        <input
          {...nativeInputProps(props, id, error)}
          ref={(element) => {
            input.current = element
            element?.setCustomValidity(
              unavailable ? t('datePicker.unavailable') : '',
            )
          }}
          id={id}
          name={name}
          type={type}
          value={text}
          min={withTime && min ? min + 'T00:00' : min}
          max={withTime && max ? max + 'T23:59' : max}
          step={timeStep === undefined ? undefined : timeStep * 60}
          onChange={(event) => {
            const { value: nextText, validity } = event.currentTarget
            if (validity.stepMismatch) {
              setDraft({ source: saved, text: nextText })
            } else if (!validity.badInput) {
              change(nextText)
            }
          }}
        />
        {(props.isClearable ?? true) &&
          text &&
          !props.isDisabled &&
          !props.isReadOnly && (
            <Button
              icon="close"
              variant="ghost"
              size="sm"
              aria-label={t('datePicker.clear')}
              onClick={() => {
                change('')
                input.current?.focus()
              }}
            />
          )}
      </div>
    </Field>
  )
}

export function DatePicker(props: DatePickerProps) {
  return <NativeDateField {...props} type="date" />
}

export function DateTimePicker(props: DateTimePickerProps) {
  return <NativeDateField {...props} type="datetime-local" />
}

export function DateRangePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  startName,
  endName,
  presets,
  ...props
}: DateRangePickerProps) {
  const { t } = useTranslation()
  const id = useId()
  const startInput = useRef<HTMLInputElement>(null)
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [draft, setDraft] = useState<{
    source: string
    start: string
    end: string
  }>()
  const savedStart = value ? dateInputValue(value.start) : ''
  const savedEnd = value ? dateInputValue(value.end) : ''
  const source = savedStart + '/' + savedEnd
  const currentDraft = draft?.source === source ? draft : undefined
  const start = currentDraft?.start ?? savedStart
  const end = currentDraft?.end ?? savedEnd
  const startDate = start ? localDate(start) : null
  const endDate = end ? localDate(end) : null
  const unavailable =
    (startDate && !isAvailable(startDate, props)) ||
    (endDate && !isAvailable(endDate, props))
  const outOfOrder = startDate && endDate && endDate < startDate
  const validationError = unavailable
    ? t('datePicker.unavailable')
    : outOfOrder
      ? t('datePicker.order')
      : undefined
  const error = props.error ?? validationError
  const inputProps = nativeInputProps(props, id, error)
  const min = props.min ? dateInputValue(props.min) : undefined
  const max = props.max ? dateInputValue(props.max) : undefined
  const isLocked = props.isDisabled || props.isReadOnly

  function update(next: DateRange | null) {
    setDraft(undefined)
    if (
      next?.start.getTime() !== value?.start.getTime() ||
      next?.end.getTime() !== value?.end.getTime()
    ) {
      setValue(next)
    }
  }

  function change(nextStart: string, nextEnd: string) {
    const first = nextStart ? localDate(nextStart) : null
    const last = nextEnd ? localDate(nextEnd) : null

    if (!first && !last) {
      update(null)
    } else if (
      first &&
      last &&
      last >= first &&
      isAvailable(first, props) &&
      isAvailable(last, props)
    ) {
      update({ start: first, end: last })
    } else {
      setDraft({ source, start: nextStart, end: nextEnd })
    }
  }

  return (
    <Field
      id={id}
      label={props.label}
      hint={props.hint}
      error={error}
      isRequired={props.isRequired}
      className={props.className}
    >
      <div className="date-picker-fields">
        <div className="date-picker-range">
          <input
            {...inputProps}
            ref={(element) => {
              startInput.current = element
              element?.setCustomValidity(validationError ?? '')
            }}
            id={id}
            name={startName}
            type="date"
            aria-label={t('datePicker.start', { label: props.label })}
            value={start}
            min={min}
            max={max}
            required={props.isRequired || Boolean(end)}
            onChange={(event) => {
              if (!event.currentTarget.validity.badInput) {
                change(event.currentTarget.value, end)
              }
            }}
          />
          <input
            {...inputProps}
            name={endName}
            type="date"
            aria-label={t('datePicker.end', { label: props.label })}
            value={end}
            min={min}
            max={max}
            required={props.isRequired || Boolean(start)}
            onChange={(event) => {
              if (!event.currentTarget.validity.badInput) {
                change(start, event.currentTarget.value)
              }
            }}
          />
        </div>
        {(props.isClearable ?? true) && (start || end) && !isLocked && (
          <Button
            icon="close"
            variant="ghost"
            size="sm"
            aria-label={t('datePicker.clear')}
            onClick={() => {
              update(null)
              startInput.current?.focus()
            }}
          />
        )}
      </div>
      {presets && presets.length > 0 && (
        <div
          className="date-picker-presets"
          role="group"
          aria-label={t('datePicker.presets')}
        >
          {presets.map(({ id: presetId, label, range }) => (
            <Button
              key={presetId}
              variant="ghost"
              size="sm"
              disabled={
                isLocked ||
                range.end < range.start ||
                !isAvailable(range.start, props) ||
                !isAvailable(range.end, props)
              }
              aria-pressed={
                isSameDay(startDate ?? undefined, range.start) &&
                isSameDay(endDate ?? undefined, range.end)
              }
              onClick={() => update(range)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
    </Field>
  )
}
