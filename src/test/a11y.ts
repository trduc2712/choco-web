import axe from 'axe-core'
import { expect } from 'vitest'

const WCAG_21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// axe-core allows one run at a time, and a test that times out doesn't stop
// its run. Without waiting for it, every later check in the file would fail
// with "Axe is already running".
let previousRun: Promise<unknown> = Promise.resolve()

export async function expectNoA11yViolations(container: Element) {
  // Chain before awaiting, so two callers can never start axe together.
  const run = previousRun
    .catch(() => undefined)
    .then(() =>
      axe.run(container, {
        runOnly: { type: 'tag', values: WCAG_21_AA_TAGS },
        rules: { 'color-contrast': { enabled: false } },
        // Only violations are checked; skipping other result details is faster.
        resultTypes: ['violations'],
      }),
    )
  previousRun = run
  const { violations } = await run

  expect(violations.map(({ id, help }) => `${id}: ${help}`)).toEqual([])
}
