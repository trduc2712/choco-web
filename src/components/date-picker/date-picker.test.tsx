import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
} from '@/components/date-picker/date-picker'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const LABEL = 'Schedule'
const START = new Date(2026, 2, 10)
const END = new Date(2026, 2, 12)

function rangeInput(part: 'start' | 'end') {
  return screen.getByLabelText(i18n.t(`datePicker.${part}`, { label: LABEL }))
}

test('uses a labeled native date input and submits the local calendar day', async () => {
  const { container } = render(
    <form aria-label="Schedule form">
      <DatePicker
        label={LABEL}
        hint="Choose a day"
        name="date"
        defaultValue={START}
      />
    </form>,
  )
  const input = screen.getByLabelText(LABEL)
  const form = screen.getByRole<HTMLFormElement>('form')

  expect(input).toHaveAttribute('type', 'date')
  expect(input).toHaveValue('2026-03-10')
  expect(input).toHaveAccessibleDescription('Choose a day')
  expect(new FormData(form).get('date')).toBe('2026-03-10')
  await expectNoA11yViolations(container)
})

test('emits local dates and follows the controlled value', () => {
  const onChange = vi.fn()
  const { rerender } = render(
    <DatePicker label={LABEL} value={START} onChange={onChange} />,
  )
  const input = screen.getByLabelText(LABEL)

  fireEvent.change(input, { target: { value: '2026-03-12' } })

  expect(onChange).toHaveBeenCalledWith(END)
  expect(input).toHaveValue('2026-03-10')
  rerender(<DatePicker label={LABEL} value={END} onChange={onChange} />)
  expect(input).toHaveValue('2026-03-12')
})

test('rejects dates outside native bounds or disallowed by the caller', () => {
  const onChange = vi.fn()
  render(
    <DatePicker
      label={LABEL}
      min={START}
      max={END}
      isDateDisabled={(date) => date.getDate() === 11}
      onChange={onChange}
    />,
  )
  const input = screen.getByLabelText(LABEL)

  expect(input).toHaveAttribute('min', '2026-03-10')
  expect(input).toHaveAttribute('max', '2026-03-12')
  fireEvent.change(input, { target: { value: '2026-03-09' } })
  expect(input).toBeInvalid()
  fireEvent.change(input, { target: { value: '2026-03-11' } })
  expect(input).toHaveAccessibleDescription(i18n.t('datePicker.unavailable'))
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.change(input, { target: { value: '2026-03-12' } })
  expect(onChange).toHaveBeenCalledWith(END)
  expect(input).toBeValid()
})

test('clears the date and restores focus', async () => {
  const onChange = vi.fn()
  render(<DatePicker label={LABEL} defaultValue={START} onChange={onChange} />)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('datePicker.clear') }),
  )

  expect(onChange).toHaveBeenCalledWith(null)
  expect(screen.getByLabelText(LABEL)).toHaveValue('')
  expect(screen.getByLabelText(LABEL)).toHaveFocus()
})

test('uses native required, read-only and disabled states', () => {
  const { rerender } = render(<DatePicker label={LABEL} isRequired />)
  const input = screen.getByLabelText(/^Schedule/)

  expect(input).toBeRequired()
  expect(input).toBeInvalid()
  rerender(<DatePicker label={LABEL} isReadOnly isDisabled />)
  expect(input).toHaveAttribute('readonly')
  expect(input).toBeDisabled()
})

test('commits a range only when both native date fields are complete and ordered', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <DateRangePicker label={LABEL} onChange={onChange} />,
  )
  const start = rangeInput('start')
  const end = rangeInput('end')

  expect(start).toHaveAttribute('type', 'date')
  expect(end).toHaveAttribute('type', 'date')
  fireEvent.change(start, { target: { value: '2026-03-12' } })
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.change(end, { target: { value: '2026-03-10' } })
  expect(start).toHaveAccessibleDescription(i18n.t('datePicker.order'))
  expect(start).toBeInvalid()
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.change(start, { target: { value: '2026-03-10' } })
  fireEvent.change(end, { target: { value: '2026-03-12' } })
  expect(onChange).toHaveBeenLastCalledWith({ start: START, end: END })
  expect(start).toBeValid()
  await expectNoA11yViolations(container)
})

test('applies a preset, submits both dates and clears the range', async () => {
  const onChange = vi.fn()
  const range = { start: START, end: END }
  render(
    <form aria-label="Schedule form">
      <DateRangePicker
        label={LABEL}
        startName="start"
        endName="end"
        presets={[{ id: 'preset', label: 'Quick range', range }]}
        onChange={onChange}
      />
    </form>,
  )

  const preset = screen.getByRole('button', { name: 'Quick range' })
  await userEvent.click(preset)

  expect(preset).toHaveAttribute('aria-pressed', 'true')
  expect(onChange).toHaveBeenCalledWith(range)
  const data = new FormData(screen.getByRole<HTMLFormElement>('form'))
  expect(data.get('start')).toBe('2026-03-10')
  expect(data.get('end')).toBe('2026-03-12')

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('datePicker.clear') }),
  )
  expect(onChange).toHaveBeenLastCalledWith(null)
  expect(rangeInput('start')).toHaveValue('')
  expect(rangeInput('end')).toHaveValue('')
})

test('uses a native local date-time input and submits the chosen time', () => {
  const onChange = vi.fn()
  render(
    <form aria-label="Schedule form">
      <DateTimePicker
        label={LABEL}
        name="date-time"
        timeStep={30}
        onChange={onChange}
      />
    </form>,
  )
  const input = screen.getByLabelText(LABEL)

  expect(input).toHaveAttribute('type', 'datetime-local')
  expect(input).toHaveAttribute('step', '1800')
  fireEvent.change(input, { target: { value: '2026-03-12T14:30' } })
  expect(onChange).toHaveBeenCalledWith(new Date(2026, 2, 12, 14, 30))
  expect(
    new FormData(screen.getByRole<HTMLFormElement>('form')).get('date-time'),
  ).toBe('2026-03-12T14:30')
})
