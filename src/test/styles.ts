import { expect } from 'vitest'

type Styles = Readonly<Record<string, string>>

export function expectStyle(
  element: Element | null,
  styles: Styles,
  key: string,
) {
  expect(styles[key], `missing class "${key}" in stylesheet`).toBeTruthy()
  expect(element).toHaveClass(styles[key])
}

export function expectNoStyle(
  element: Element | null,
  styles: Styles,
  key: string,
) {
  expect(styles[key], `missing class "${key}" in stylesheet`).toBeTruthy()
  expect(element).not.toHaveClass(styles[key])
}
