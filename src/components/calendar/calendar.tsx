import type { KeyboardEvent, ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { cx } from '@/lib/cx'

import styles from './calendar.module.scss'
import type { DateRange } from './date-utils'
import {
  addDays,
  addMonths,
  getIsoWeek,
  getMonthGrid,
  getWeekStart,
  isSameDay,
  isSameMonth,
  isWithin,
  startOfDay,
  startOfMonth,
  toDateKey,
} from './date-utils'

type CalendarView = 'days' | 'months' | 'years'

type CalendarBaseProps = {
  label?: string
  min?: Date
  max?: Date
  isDateDisabled?: (date: Date) => boolean
  weekStartsOn?: number
  defaultMonth?: Date
  numberOfMonths?: 1 | 2
  footer?: ReactNode
  hasWeekNumbers?: boolean
  autoFocus?: boolean
  className?: string
}

type SingleCalendarProps = CalendarBaseProps & {
  mode?: 'single'
  value?: Date | null
  onChange?: (date: Date) => void
}

type RangeCalendarProps = CalendarBaseProps & {
  mode: 'range'
  value?: DateRange | null
  onChange?: (range: DateRange) => void
}

export type CalendarProps = SingleCalendarProps | RangeCalendarProps

const YEARS_PER_PAGE = 12
const PICKER_COLUMNS = 3
const YEARS_BEFORE = 4

export function Calendar(props: CalendarProps) {
  const {
    label,
    min,
    max,
    isDateDisabled,
    weekStartsOn,
    defaultMonth,
    numberOfMonths = 1,
    hasWeekNumbers = false,
    footer,
    autoFocus = false,
    className,
  } = props
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const shouldFocus = useRef(autoFocus)
  const selected =
    props.mode === 'range' ? props.value?.start : (props.value ?? undefined)
  const [focused, setFocused] = useState(() =>
    startOfDay(selected ?? defaultMonth ?? new Date()),
  )
  const [month, setMonth] = useState(() => startOfMonth(focused))
  const [view, setView] = useState<CalendarView>('days')
  const [rangeStart, setRangeStart] = useState<Date>()
  const [hovered, setHovered] = useState<Date>()
  const weekStart = weekStartsOn ?? getWeekStart(locale)
  const today = startOfDay(new Date())
  const isMultiMonth = numberOfMonths > 1
  const months = Array.from({ length: numberOfMonths }, (_, index) =>
    addMonths(month, index),
  )
  const lastMonth = months[months.length - 1]

  const range =
    props.mode === 'range'
      ? rangeStart
        ? hovered
          ? {
              start: hovered < rangeStart ? hovered : rangeStart,
              end: hovered < rangeStart ? rangeStart : hovered,
            }
          : { start: rangeStart, end: rangeStart }
        : (props.value ?? undefined)
      : undefined

  useEffect(() => {
    if (shouldFocus.current) {
      rootRef.current
        ?.querySelector<HTMLButtonElement>('[data-focus-target="true"]')
        ?.focus()
    }
  }, [focused, month, view])

  function isDisabled(date: Date) {
    return (
      (min !== undefined && date < startOfDay(min)) ||
      (max !== undefined && date > startOfDay(max)) ||
      (isDateDisabled?.(date) ?? false)
    )
  }

  function moveFocus(date: Date) {
    shouldFocus.current = true
    setFocused(date)

    if (date < month) {
      setMonth(startOfMonth(date))
    } else if (date >= addMonths(lastMonth, 1)) {
      setMonth(startOfMonth(addMonths(date, 1 - numberOfMonths)))
    }
  }

  function select(date: Date) {
    if (isDisabled(date)) {
      return
    }

    moveFocus(date)

    if (props.mode === 'range') {
      if (!rangeStart) {
        setRangeStart(date)
        return
      }

      const [start, end] =
        date < rangeStart ? [date, rangeStart] : [rangeStart, date]
      setRangeStart(undefined)
      setHovered(undefined)
      props.onChange?.({ start, end })
    } else {
      props.onChange?.(date)
    }
  }

  function handleDayKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const dayOfWeek = (focused.getDay() - weekStart + 7) % 7
    const next = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -dayOfWeek),
      End: () => addDays(focused, 6 - dayOfWeek),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    }[event.key]

    if (next) {
      event.preventDefault()
      moveFocus(next())
    }
  }

  function step(offset: number) {
    shouldFocus.current = false
    const monthCount = {
      days: offset,
      months: offset * 12,
      years: offset * 12 * YEARS_PER_PAGE,
    }[view]
    const next = addMonths(month, monthCount)
    setMonth(next)
    setFocused(view === 'days' ? next : addMonths(focused, monthCount))
  }

  function openPicker(nextView: CalendarView) {
    shouldFocus.current = true
    setView(nextView)
  }

  function pickMonth(monthIndex: number) {
    const next = new Date(month.getFullYear(), monthIndex, 1)
    shouldFocus.current = true
    setMonth(next)
    setFocused(next)
    setView('days')
  }

  function pickYear(year: number) {
    const next = new Date(year, month.getMonth(), 1)
    shouldFocus.current = true
    setMonth(next)
    setFocused(next)
    setView('months')
  }

  const year = month.getFullYear()
  // The shown year sits in the second row, so nearby years on both sides fit.
  const firstYear = year - YEARS_BEFORE
  const monthFormat = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  })
  const monthNameFormat = new Intl.DateTimeFormat(locale, { month: 'long' })
  const yearFormat = new Intl.DateTimeFormat(locale, { year: 'numeric' })
  const isFirstPage =
    min !== undefined &&
    {
      days: !(startOfMonth(min) < month),
      months: min.getFullYear() >= year,
      years: min.getFullYear() >= firstYear,
    }[view]
  const isLastPage =
    max !== undefined &&
    {
      days: !(startOfMonth(max) > lastMonth),
      months: max.getFullYear() <= year,
      years: max.getFullYear() < firstYear + YEARS_PER_PAGE,
    }[view]
  const previousLabel = {
    days: t('calendar.previousMonth'),
    months: t('calendar.previousYear'),
    years: t('calendar.previousYears'),
  }[view]
  const nextLabel = {
    days: t('calendar.nextMonth'),
    months: t('calendar.nextYear'),
    years: t('calendar.nextYears'),
  }[view]

  function renderTitle(shown: Date, titleId: string) {
    const title = monthFormat.format(shown)

    if (isMultiMonth) {
      return (
        <div id={titleId} className={styles.title} aria-live="polite">
          {title}
        </div>
      )
    }

    if (view === 'days') {
      return (
        <button
          className={styles.titleButton}
          type="button"
          aria-label={t('calendar.chooseMonth', { title })}
          onClick={() => openPicker('months')}
        >
          <span id={titleId} aria-live="polite">
            {title}
          </span>
        </button>
      )
    }

    const pickerTitle =
      view === 'months'
        ? yearFormat.format(month)
        : `${firstYear} – ${firstYear + YEARS_PER_PAGE - 1}`

    return view === 'months' ? (
      <button
        className={styles.titleButton}
        type="button"
        aria-label={t('calendar.chooseYear', { title: pickerTitle })}
        onClick={() => openPicker('years')}
      >
        <span id={titleId} aria-live="polite">
          {pickerTitle}
        </span>
      </button>
    ) : (
      <div id={titleId} className={styles.title} aria-live="polite">
        {pickerTitle}
      </div>
    )
  }

  const pickerTitleId = `${id}-picker-title`

  return (
    <div
      ref={rootRef}
      className={cx(styles.root, className)}
      role="group"
      aria-label={label}
      aria-labelledby={
        label ? undefined : view === 'days' ? `${id}-title-0` : pickerTitleId
      }
    >
      <div className={cx(styles.months, isMultiMonth && styles.multi)}>
        {(view === 'days' ? months : [month]).map((shown, index) => {
          const titleId =
            view === 'days' ? `${id}-title-${index}` : pickerTitleId

          return (
            <div key={toDateKey(shown)} className={styles.month}>
              <div className={styles.header}>
                {index === 0 ? (
                  <Button
                    icon="chevron-left"
                    variant="ghost"
                    size="sm"
                    aria-label={previousLabel}
                    disabled={isFirstPage}
                    onClick={() => step(-1)}
                  />
                ) : (
                  <span className={styles.spacer} />
                )}
                {renderTitle(shown, titleId)}
                {index === months.length - 1 || view !== 'days' ? (
                  <Button
                    icon="chevron-right"
                    variant="ghost"
                    size="sm"
                    aria-label={nextLabel}
                    disabled={isLastPage}
                    onClick={() => step(1)}
                  />
                ) : (
                  <span className={styles.spacer} />
                )}
              </div>
              {view === 'days' && (
                <DayGrid
                  month={shown}
                  titleId={titleId}
                  weekStart={weekStart}
                  locale={locale}
                  today={today}
                  focused={focused}
                  isMultiMonth={isMultiMonth}
                  hasWeekNumbers={hasWeekNumbers}
                  isRange={props.mode === 'range'}
                  selected={selected}
                  range={range}
                  isDisabled={isDisabled}
                  onSelect={select}
                  onHover={(day) => rangeStart && setHovered(day)}
                  onKeyDown={handleDayKeyDown}
                />
              )}
              {view === 'months' && (
                <PickerGrid
                  titleId={pickerTitleId}
                  items={Array.from({ length: 12 }, (_, monthIndex) => ({
                    key: monthIndex,
                    label: monthNameFormat.format(new Date(year, monthIndex)),
                    isSelected:
                      selected !== undefined &&
                      isSameMonth(selected, new Date(year, monthIndex)),
                    isCurrent: isSameMonth(today, new Date(year, monthIndex)),
                    isDisabled:
                      (min !== undefined &&
                        new Date(year, monthIndex + 1, 0) < startOfDay(min)) ||
                      (max !== undefined &&
                        new Date(year, monthIndex, 1) > startOfDay(max)),
                  }))}
                  initialKey={month.getMonth()}
                  onPick={pickMonth}
                />
              )}
              {view === 'years' && (
                <PickerGrid
                  titleId={pickerTitleId}
                  items={Array.from({ length: YEARS_PER_PAGE }, (_, offset) => {
                    const itemYear = firstYear + offset

                    return {
                      key: itemYear,
                      label: String(itemYear),
                      isSelected: selected?.getFullYear() === itemYear,
                      isCurrent: today.getFullYear() === itemYear,
                      isDisabled:
                        (min !== undefined && itemYear < min.getFullYear()) ||
                        (max !== undefined && itemYear > max.getFullYear()),
                    }
                  })}
                  initialKey={year}
                  onPick={pickYear}
                />
              )}
            </div>
          )
        })}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}

type DayGridProps = {
  month: Date
  titleId: string
  weekStart: number
  locale: string | undefined
  today: Date
  focused: Date
  isMultiMonth: boolean
  hasWeekNumbers: boolean
  isRange: boolean
  selected: Date | undefined
  range: DateRange | undefined
  isDisabled: (date: Date) => boolean
  onSelect: (date: Date) => void
  onHover: (date: Date) => void
  onKeyDown: (event: KeyboardEvent<HTMLTableElement>) => void
}

function DayGrid({
  month,
  titleId,
  weekStart,
  locale,
  today,
  focused,
  isMultiMonth,
  hasWeekNumbers,
  isRange,
  selected,
  range,
  isDisabled,
  onSelect,
  onHover,
  onKeyDown,
}: DayGridProps) {
  const { t } = useTranslation()
  const weeks = getMonthGrid(month, weekStart)
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const weekdayLongFormat = new Intl.DateTimeFormat(locale, { weekday: 'long' })
  const dayLabelFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'full' })

  return (
    <table
      className={styles.grid}
      role="grid"
      aria-labelledby={titleId}
      aria-multiselectable={isRange || undefined}
      onKeyDown={onKeyDown}
    >
      <thead>
        <tr>
          {hasWeekNumbers && (
            <th
              className={styles.weekNumber}
              scope="col"
              abbr={t('calendar.week')}
            >
              {t('calendar.weekShort')}
            </th>
          )}
          {weeks[0].map((day) => (
            <th
              key={day.getDay()}
              className={styles.weekday}
              scope="col"
              abbr={weekdayLongFormat.format(day)}
            >
              {weekdayFormat.format(day)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={toDateKey(week[0])}>
            {hasWeekNumbers && (
              <th
                className={styles.weekNumber}
                scope="row"
                aria-label={t('calendar.weekNumber', {
                  number: getIsoWeek(week[(8 - weekStart) % 7]),
                })}
              >
                {getIsoWeek(week[(8 - weekStart) % 7])}
              </th>
            )}
            {week.map((day) => {
              const isOutside = !isSameMonth(day, month)

              // Side-by-side months show each day once, in its own month.
              if (isOutside && isMultiMonth) {
                return <td key={toDateKey(day)} role="gridcell" />
              }

              const isSelected = isRange
                ? isWithin(day, range)
                : isSameDay(day, selected)
              const isRangeStart = isSameDay(day, range?.start)
              const isRangeEnd = isSameDay(day, range?.end)
              const isFocusTarget = isSameDay(day, focused)

              return (
                <td
                  key={toDateKey(day)}
                  className={cx(
                    range && isSelected && styles.inRange,
                    isRangeStart && styles.rangeStart,
                    isRangeEnd && styles.rangeEnd,
                  )}
                  role="gridcell"
                  aria-selected={isSelected}
                >
                  <button
                    className={cx(
                      styles.day,
                      isOutside && styles.outside,
                      isSameDay(day, today) && styles.today,
                      (isRange ? isRangeStart || isRangeEnd : isSelected) &&
                        styles.selected,
                    )}
                    type="button"
                    data-date={toDateKey(day)}
                    data-focus-target={isFocusTarget || undefined}
                    tabIndex={isFocusTarget ? 0 : -1}
                    disabled={isDisabled(day)}
                    aria-label={dayLabelFormat.format(day)}
                    aria-current={isSameDay(day, today) ? 'date' : undefined}
                    onClick={() => onSelect(day)}
                    onMouseEnter={() => onHover(day)}
                  >
                    {day.getDate()}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

type PickerItem = {
  key: number
  label: string
  isSelected: boolean
  isCurrent: boolean
  isDisabled: boolean
}

type PickerGridProps = {
  titleId: string
  items: PickerItem[]
  initialKey: number
  onPick: (key: number) => void
}

function PickerGrid({ titleId, items, initialKey, onPick }: PickerGridProps) {
  const [activeKey, setActiveKey] = useState(initialKey)
  const buttonRefs = useRef(new Map<number, HTMLButtonElement>())
  const rows = Array.from(
    { length: Math.ceil(items.length / PICKER_COLUMNS) },
    (_, row) => items.slice(row * PICKER_COLUMNS, (row + 1) * PICKER_COLUMNS),
  )

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const index = items.findIndex((item) => item.key === activeKey)
    const offset = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -PICKER_COLUMNS,
      ArrowDown: PICKER_COLUMNS,
    }[event.key]
    const next = offset === undefined ? undefined : items[index + offset]

    if (next) {
      event.preventDefault()
      setActiveKey(next.key)
      buttonRefs.current.get(next.key)?.focus()
    }
  }

  return (
    <table
      className={styles.picker}
      role="grid"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      <tbody>
        {rows.map((row) => (
          <tr key={row[0].key}>
            {row.map((item) => (
              <td
                key={item.key}
                role="gridcell"
                aria-selected={item.isSelected}
              >
                <button
                  ref={(element) => {
                    if (element) {
                      buttonRefs.current.set(item.key, element)
                    } else {
                      buttonRefs.current.delete(item.key)
                    }
                  }}
                  className={cx(
                    styles.pickerItem,
                    item.isCurrent && styles.today,
                    item.isSelected && styles.selected,
                  )}
                  type="button"
                  data-focus-target={item.key === activeKey || undefined}
                  tabIndex={item.key === activeKey ? 0 : -1}
                  disabled={item.isDisabled}
                  onClick={() => onPick(item.key)}
                >
                  {item.label}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
