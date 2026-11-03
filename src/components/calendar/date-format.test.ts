import { expect, test } from 'vitest'

import {
  formatDateInput,
  getDateOrder,
  getDatePlaceholder,
  parseDateInput,
} from '@/components/calendar/date-format'

const DATE = new Date(2026, 0, 2)

test('follows the order and separator of the locale', () => {
  expect(getDateOrder('en-US')).toEqual(['month', 'day', 'year'])
  expect(getDateOrder('vi')).toEqual(['day', 'month', 'year'])
  expect(getDatePlaceholder('en-US')).toBe('mm/dd/yyyy')
  expect(getDatePlaceholder('de')).toBe('dd.mm.yyyy')
  expect(formatDateInput(DATE, 'en-US')).toBe('01/02/2026')
  expect(formatDateInput(DATE, 'vi')).toBe('02/01/2026')
})

test('parses typed dates with any separator', () => {
  expect(parseDateInput('01/02/2026', 'en-US')).toEqual(DATE)
  expect(parseDateInput('1-2-26', 'en-US')).toEqual(DATE)
  expect(parseDateInput('02.01.2026', 'de')).toEqual(DATE)
})

test('rejects text that is not a real date', () => {
  expect(parseDateInput('', 'en-US')).toBeNull()
  expect(parseDateInput('02/30/2026', 'en-US')).toBeUndefined()
  expect(parseDateInput('13/01/2026', 'en-US')).toBeUndefined()
  expect(parseDateInput('date', 'en-US')).toBeUndefined()
})
