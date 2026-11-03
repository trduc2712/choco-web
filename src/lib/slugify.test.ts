import { expect, test } from 'vitest'

import { slugify } from './slugify'

test('turns a title into a url-safe id', () => {
  expect(slugify('Hint, error and required')).toBe('hint-error-and-required')
})

test('drops accents and surrounding separators', () => {
  expect(slugify('  Café — Menu! ')).toBe('cafe-menu')
})
