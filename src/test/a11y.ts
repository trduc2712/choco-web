import axe from 'axe-core'
import { expect } from 'vitest'

const WCAG_21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

export async function expectNoA11yViolations(container: Element) {
  const { violations } = await axe.run(container, {
    runOnly: { type: 'tag', values: WCAG_21_AA_TAGS },
    rules: { 'color-contrast': { enabled: false } },
  })

  expect(violations.map(({ id, help }) => `${id}: ${help}`)).toEqual([])
}
