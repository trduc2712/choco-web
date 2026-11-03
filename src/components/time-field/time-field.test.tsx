import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import {
  getTimePlaceholder,
  parseTimeInput,
  uses12HourClock,
} from '@/components/calendar/time-format'
import { TimeField } from '@/components/time-field/time-field'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const LABEL = 'Time Label'

test('reads the clock of the locale', () => {
  expect(uses12HourClock('en-US')).toBe(true)
  expect(uses12HourClock('vi')).toBe(false)
  expect(getTimePlaceholder('de')).toBe('hh:mm')
})

test('parses typed times in 12- and 24-hour forms', () => {
  expect(parseTimeInput('14:30')).toEqual({ hours: 14, minutes: 30 })
  expect(parseTimeInput('1430')).toEqual({ hours: 14, minutes: 30 })
  expect(parseTimeInput('2:30 pm')).toEqual({ hours: 14, minutes: 30 })
  expect(parseTimeInput('12 AM')).toEqual({ hours: 0, minutes: 0 })
  expect(parseTimeInput('9')).toEqual({ hours: 9, minutes: 0 })
  expect(parseTimeInput('')).toBeNull()
  expect(parseTimeInput('24:00')).toBeUndefined()
  expect(parseTimeInput('13 pm')).toBeUndefined()
  expect(parseTimeInput('10:75')).toBeUndefined()
})

test('shows the time in the locale and accepts a typed one', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <TimeField label={LABEL} defaultValue="09:05" onChange={onChange} />,
  )
  const input = screen.getByRole('textbox', { name: LABEL })

  expect(input).toHaveValue('09:05 AM')

  await userEvent.clear(input)
  await userEvent.type(input, '4:45 pm{Enter}')

  expect(onChange).toHaveBeenLastCalledWith('16:45')
  await expectNoA11yViolations(container)
})

test('steps with the arrow keys and snaps to the step', async () => {
  const onChange = vi.fn()
  render(
    <TimeField
      label={LABEL}
      defaultValue="09:07"
      step={15}
      onChange={onChange}
    />,
  )

  await userEvent.click(screen.getByRole('textbox', { name: LABEL }))
  await userEvent.keyboard('{ArrowUp}')

  expect(onChange).toHaveBeenLastCalledWith('09:15')

  await userEvent.keyboard('{ArrowDown}{ArrowDown}')

  expect(onChange).toHaveBeenLastCalledWith('08:45')
})

test('explains times that are not real or out of range', async () => {
  render(<TimeField label={LABEL} min="09:00" max="17:00" />)
  const input = screen.getByRole('textbox', { name: LABEL })

  await userEvent.type(input, '25:00{Enter}')

  expect(input).toHaveAccessibleDescription(i18n.t('timeField.invalid'))

  await userEvent.clear(input)
  await userEvent.type(input, '18:00{Enter}')

  expect(input).toHaveAccessibleDescription(
    i18n.t('timeField.outOfRange', { min: '09:00 AM', max: '05:00 PM' }),
  )
})

test('submits a 24-hour time with a form', () => {
  const { container } = render(
    <form>
      <TimeField label={LABEL} name="time-field" defaultValue="16:45" />
    </form>,
  )

  expect(
    new FormData(container.querySelector('form') as HTMLFormElement).get(
      'time-field',
    ),
  ).toBe('16:45')
})
