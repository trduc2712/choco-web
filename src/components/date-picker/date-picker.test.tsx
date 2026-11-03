import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { DateRangePreset } from '@/components/date-picker/date-picker'
import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
} from '@/components/date-picker/date-picker'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const LABEL = 'Date Label'
const DATE = new Date(2026, 2, 10)

function openButton(label = LABEL) {
  return screen.getByRole('button', {
    name: i18n.t('datePicker.open', { label }),
  })
}

test('shows the value in the locale format with a placeholder pattern', async () => {
  const { container, rerender } = render(
    <DatePicker label={LABEL} hint="Hint Text" defaultValue={DATE} />,
  )
  const input = screen.getByRole('textbox', { name: LABEL })

  expect(input).toHaveValue('03/10/2026')
  expect(input).toHaveAccessibleDescription('Hint Text')
  await expectNoA11yViolations(container)

  rerender(<DatePicker label="Other Label" />)

  expect(screen.getByRole('textbox', { name: 'Other Label' })).toHaveAttribute(
    'placeholder',
    'mm/dd/yyyy',
  )
})

test('accepts a typed date on Enter or blur', async () => {
  const onChange = vi.fn()
  render(<DatePicker label={LABEL} onChange={onChange} />)
  const input = screen.getByRole('textbox', { name: LABEL })

  await userEvent.type(input, '3-10-26{Enter}')

  expect(onChange).toHaveBeenLastCalledWith(DATE)
  expect(input).toHaveValue('03/10/2026')
})

test('explains typed dates that are not real or not allowed', async () => {
  const onChange = vi.fn()
  render(
    <DatePicker label={LABEL} min={new Date(2026, 0, 1)} onChange={onChange} />,
  )
  const input = screen.getByRole('textbox', { name: LABEL })

  await userEvent.type(input, '02/30/2026')
  await userEvent.tab()

  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription(i18n.t('datePicker.invalid'))

  await userEvent.clear(input)
  await userEvent.type(input, '12/31/2025{Enter}')

  expect(input).toHaveAccessibleDescription(i18n.t('datePicker.unavailable'))
  expect(onChange).not.toHaveBeenCalled()
})

test('picks from the calendar and returns focus to the field', async () => {
  const onChange = vi.fn()
  render(<DatePicker label={LABEL} defaultValue={DATE} onChange={onChange} />)

  await userEvent.click(openButton())

  expect(
    screen.getByRole('button', { name: 'Tuesday, March 10, 2026' }),
  ).toHaveFocus()

  await userEvent.keyboard('{ArrowRight}{Enter}')

  expect(onChange).toHaveBeenCalledWith(new Date(2026, 2, 11))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: LABEL })).toHaveFocus()
})

test('opens with Alt+ArrowDown and picks today from the footer', async () => {
  const onChange = vi.fn()
  render(<DatePicker label={LABEL} onChange={onChange} />)

  await userEvent.click(screen.getByRole('textbox', { name: LABEL }))
  await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: i18n.t('datePicker.today'),
    }),
  )

  const [picked] = onChange.mock.lastCall ?? []
  const today = new Date()

  expect(picked.toDateString()).toBe(today.toDateString())
})

test('clears the value', async () => {
  const onChange = vi.fn()
  render(<DatePicker label={LABEL} defaultValue={DATE} onChange={onChange} />)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('datePicker.clear') }),
  )

  expect(onChange).toHaveBeenLastCalledWith(null)
  expect(screen.getByRole('textbox', { name: LABEL })).toHaveValue('')
})

test('submits an ISO date with a form', () => {
  const { container } = render(
    <form>
      <DatePicker label={LABEL} name="date-field" defaultValue={DATE} />
    </form>,
  )
  const form = container.querySelector('form') as HTMLFormElement

  expect(new FormData(form).get('date-field')).toBe('2026-03-10')
})

test('cannot be changed when read only', () => {
  render(<DatePicker label={LABEL} defaultValue={DATE} isReadOnly />)

  expect(screen.getByRole('textbox', { name: LABEL })).toHaveAttribute(
    'readonly',
  )
  expect(openButton()).toBeDisabled()
  expect(
    screen.queryByRole('button', { name: i18n.t('datePicker.clear') }),
  ).not.toBeInTheDocument()
})

const START = new Date(2026, 2, 10)
const END = new Date(2026, 2, 12)

function rangeInput(part: 'start' | 'end', label = LABEL) {
  return screen.getByRole('textbox', {
    name: i18n.t(`datePicker.${part}`, { label }),
  })
}

test('types a range into two fields and checks its order', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <DateRangePicker label={LABEL} onChange={onChange} />,
  )

  await userEvent.type(rangeInput('start'), '03/12/2026')
  await userEvent.type(rangeInput('end'), '03/10/2026{Enter}')

  expect(rangeInput('start')).toHaveAccessibleDescription(
    i18n.t('datePicker.order'),
  )

  await userEvent.clear(rangeInput('start'))
  await userEvent.type(rangeInput('start'), '03/10/2026')
  await userEvent.clear(rangeInput('end'))
  await userEvent.type(rangeInput('end'), '03/12/2026{Enter}')

  expect(onChange).toHaveBeenLastCalledWith({ start: START, end: END })
  await expectNoA11yViolations(container)
})

test('shows two months and picks a range or a preset', async () => {
  const onChange = vi.fn()
  const presets: DateRangePreset[] = [
    {
      id: 'preset-id',
      label: 'Preset Label',
      range: { start: START, end: END },
    },
  ]
  render(
    <DateRangePicker
      label={LABEL}
      defaultValue={{ start: START, end: END }}
      presets={presets}
      onChange={onChange}
    />,
  )

  await userEvent.click(openButton())

  expect(screen.getAllByRole('grid')).toHaveLength(2)
  expect(screen.getByRole('button', { name: 'Preset Label' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await userEvent.click(
    screen.getByRole('button', { name: 'Wednesday, April 15, 2026' }),
  )
  await userEvent.click(
    screen.getByRole('button', { name: 'Saturday, April 18, 2026' }),
  )

  expect(onChange).toHaveBeenLastCalledWith({
    start: new Date(2026, 3, 15),
    end: new Date(2026, 3, 18),
  })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('submits the range with a form', () => {
  const { container } = render(
    <form>
      <DateRangePicker
        label={LABEL}
        startName="start-field"
        endName="end-field"
        defaultValue={{ start: START, end: END }}
      />
    </form>,
  )
  const data = new FormData(container.querySelector('form') as HTMLFormElement)

  expect(data.get('start-field')).toBe('2026-03-10')
  expect(data.get('end-field')).toBe('2026-03-12')
})

function timeInput(label = LABEL) {
  return screen.getByRole('textbox', {
    name: i18n.t('datePicker.time', { label }),
  })
}

test('combines a typed date and time', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <DateTimePicker label={LABEL} onChange={onChange} />,
  )

  await userEvent.type(
    screen.getByRole('textbox', { name: LABEL }),
    '03/10/2026',
  )
  await userEvent.tab()

  expect(
    screen.getByRole('textbox', { name: LABEL }),
  ).toHaveAccessibleDescription(i18n.t('datePicker.missingTime'))

  await userEvent.type(timeInput(), '2:30 pm{Enter}')

  expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 2, 10, 14, 30))
  expect(timeInput()).toHaveValue('02:30 PM')
  await expectNoA11yViolations(container)
})

test('keeps the time when another day is picked', async () => {
  const onChange = vi.fn()
  render(
    <DateTimePicker
      label={LABEL}
      defaultValue={new Date(2026, 2, 10, 14, 30)}
      onChange={onChange}
    />,
  )

  await userEvent.click(openButton())
  await userEvent.click(
    screen.getByRole('button', { name: 'Thursday, March 12, 2026' }),
  )

  expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 2, 12, 14, 30))
})

test('steps the time with the arrow keys and submits a local date-time', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <form>
      <DateTimePicker
        label={LABEL}
        name="date-time-field"
        defaultValue={new Date(2026, 2, 10, 9, 0)}
        timeStep={30}
        onChange={onChange}
      />
    </form>,
  )

  await userEvent.click(timeInput())
  await userEvent.keyboard('{ArrowUp}{Enter}')

  expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 2, 10, 9, 30))
  expect(
    new FormData(container.querySelector('form') as HTMLFormElement).get(
      'date-time-field',
    ),
  ).toBe('2026-03-10T09:30')
})
