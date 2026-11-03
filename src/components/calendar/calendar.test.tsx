import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Calendar } from '@/components/calendar/calendar'
import {
  addMonths,
  getIsoWeek,
  getMonthGrid,
  getWeekStart,
} from '@/components/calendar/date-utils'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const MARCH_10 = new Date(2026, 2, 10)

function day(name: string) {
  return screen.getByRole('button', { name })
}

test('builds a six-week grid starting on the week start', () => {
  const grid = getMonthGrid(MARCH_10, 1)

  expect(grid).toHaveLength(6)
  expect(grid[0][0]).toEqual(new Date(2026, 1, 23))
  expect(grid[0][0].getDay()).toBe(1)
})

test('keeps the day when adding months, clamped to the month length', () => {
  expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28))
})

test('reads the first day of the week from the locale', () => {
  expect([0, 1]).toContain(getWeekStart('en-US'))
})

test('shows the month of the selected date and selects a day', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <Calendar value={MARCH_10} weekStartsOn={1} onChange={onChange} />,
  )
  const grid = screen.getByRole('grid', { name: 'March 2026' })

  expect(within(grid).getAllByRole('columnheader')[0]).toHaveTextContent('Mon')
  expect(day('Tuesday, March 10, 2026').closest('td')).toHaveAttribute(
    'aria-selected',
    'true',
  )

  await userEvent.click(day('Friday, March 13, 2026'))

  expect(onChange).toHaveBeenCalledWith(new Date(2026, 2, 13))
  await expectNoA11yViolations(container)
})

test('moves focus with the keyboard and across months', async () => {
  render(<Calendar value={MARCH_10} weekStartsOn={1} />)

  await userEvent.click(day('Tuesday, March 10, 2026'))
  await userEvent.keyboard('{ArrowDown}')

  expect(day('Tuesday, March 17, 2026')).toHaveFocus()

  await userEvent.keyboard('{End}')

  expect(day('Sunday, March 22, 2026')).toHaveFocus()

  await userEvent.keyboard('{PageDown}')

  expect(day('Wednesday, April 22, 2026')).toHaveFocus()
  expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument()
})

test('changes month with the header buttons and respects min and max', async () => {
  render(
    <Calendar
      value={MARCH_10}
      min={new Date(2026, 2, 5)}
      max={new Date(2026, 3, 30)}
    />,
  )

  expect(
    screen.getByRole('button', { name: i18n.t('calendar.previousMonth') }),
  ).toBeDisabled()
  expect(day('Wednesday, March 4, 2026')).toBeDisabled()

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('calendar.nextMonth') }),
  )

  expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: i18n.t('calendar.nextMonth') }),
  ).toBeDisabled()
})

test('selects a range in two clicks, in either order', async () => {
  const onChange = vi.fn()
  render(<Calendar mode="range" defaultMonth={MARCH_10} onChange={onChange} />)

  await userEvent.click(day('Friday, March 20, 2026'))
  await userEvent.click(day('Tuesday, March 10, 2026'))

  expect(onChange).toHaveBeenCalledWith({
    start: new Date(2026, 2, 10),
    end: new Date(2026, 2, 20),
  })
  expect(screen.getByRole('grid')).toHaveAttribute(
    'aria-multiselectable',
    'true',
  )
})

test('jumps to another month and year from the title', async () => {
  const { container } = render(<Calendar value={MARCH_10} />)

  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('calendar.chooseMonth', { title: 'March 2026' }),
    }),
  )

  expect(screen.getByRole('button', { name: 'March' })).toHaveFocus()
  await expectNoA11yViolations(container)

  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('calendar.chooseYear', { title: '2026' }),
    }),
  )
  await userEvent.click(screen.getByRole('button', { name: '2028' }))
  await userEvent.keyboard('{ArrowDown}{Enter}')

  expect(screen.getByRole('grid', { name: 'June 2028' })).toBeInTheDocument()
})

test('shows two months side by side and moves focus across them', async () => {
  render(<Calendar value={MARCH_10} numberOfMonths={2} />)

  expect(
    screen
      .getAllByRole('grid')
      .map((grid) => grid.getAttribute('aria-labelledby')),
  ).toHaveLength(2)
  expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument()

  await userEvent.click(day('Tuesday, March 31, 2026'))
  await userEvent.keyboard('{ArrowRight}')

  expect(day('Wednesday, April 1, 2026')).toHaveFocus()
  expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument()
})

test('renders a footer', () => {
  render(<Calendar footer={<button type="button">Footer Action</button>} />)

  expect(
    screen.getByRole('button', { name: 'Footer Action' }),
  ).toBeInTheDocument()
})

test('numbers weeks the ISO way', () => {
  expect(getIsoWeek(new Date(2026, 0, 1))).toBe(1)
  expect(getIsoWeek(new Date(2024, 11, 30))).toBe(1)
  expect(getIsoWeek(new Date(2027, 0, 1))).toBe(53)
})

test('can show week numbers as row headers', async () => {
  const { container } = render(
    <Calendar value={MARCH_10} weekStartsOn={1} hasWeekNumbers />,
  )

  expect(
    screen.getByRole('rowheader', {
      name: i18n.t('calendar.weekNumber', { number: 11 }),
    }),
  ).toHaveTextContent('11')
  await expectNoA11yViolations(container)
})
