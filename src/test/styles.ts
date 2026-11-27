import { expect } from 'vitest'

type Styles = string

export function expectStyle(
  element: Element | null,
  styles: Styles,
  key: string,
) {
  expect(element).toHaveClass(`${styles}-${key}`)
}

export function expectNoStyle(
  element: Element | null,
  styles: Styles,
  key: string,
) {
  expect(element).not.toHaveClass(`${styles}-${key}`)
}
