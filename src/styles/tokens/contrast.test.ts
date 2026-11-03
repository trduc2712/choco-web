import { describe, expect, test } from 'vitest'

import primitives from './_primitives.scss?raw'
import semantic from './_semantic.scss?raw'
import type { ColorScheme } from './parse-tokens'
import { contrastRatio, parseTokens, resolveColor } from './parse-tokens'

type Pair = { foreground: string; background: string; minimum: number }

const TEXT_MINIMUM = 4.5
const NON_TEXT_MINIMUM = 3

const SCHEMES: ColorScheme[] = ['light', 'dark']

const SURFACES = [
  '--color-bg',
  '--color-surface',
  '--color-surface-raised',
  '--color-surface-overlay',
  '--color-fill',
  '--color-fill-hover',
]

const TEXT_ON_SURFACES = [
  '--color-text',
  '--color-text-muted',
  '--color-primary-text',
  '--color-danger-text',
  '--color-success-text',
  '--color-warning-text',
  '--color-info-text',
]

const NON_TEXT_ON_SURFACES = [
  '--color-border-strong',
  '--color-border-hover',
  '--color-focus-ring',
]

const TEXT_ON_FILLS: [foreground: string, background: string][] = [
  ['--color-text-on-primary', '--color-primary'],
  ['--color-text-on-primary', '--color-primary-hover'],
  ['--color-text-on-primary', '--color-primary-active'],
  ['--color-text-on-danger', '--color-danger'],
  ['--color-text-on-danger', '--color-danger-hover'],
  ['--color-text-on-danger', '--color-danger-active'],
  ['--color-primary-text', '--color-primary-subtle'],
  ['--color-danger-text', '--color-danger-subtle'],
  ['--color-success-text', '--color-success-subtle'],
  ['--color-warning-text', '--color-warning-subtle'],
  ['--color-text', '--color-primary-subtle'],
  ['--color-info-text', '--color-info-subtle'],
  ['--color-primary-text', '--color-primary-subtle-hover'],
  ['--color-text', '--color-fill-active'],
  ['--color-text', '--color-danger-subtle'],
  ['--color-text', '--color-success-subtle'],
  ['--color-text', '--color-warning-subtle'],
  ['--color-text', '--color-info-subtle'],
  ['--color-text-on-success', '--color-success'],
  ['--color-text-on-warning', '--color-warning'],
  ['--color-text-on-info', '--color-info'],
]

const DECORATIVE = [
  '--color-overlay',
  '--color-border',
  '--color-border-subtle',
  '--color-primary-border',
  '--color-danger-border',
  '--color-success-border',
  '--color-warning-border',
  '--color-info-border',
  '--color-focus-halo',
]

const PAIRS: Pair[] = [
  ...SURFACES.flatMap((background) => [
    ...TEXT_ON_SURFACES.map((foreground) => ({
      foreground,
      background,
      minimum: TEXT_MINIMUM,
    })),
    ...NON_TEXT_ON_SURFACES.map((foreground) => ({
      foreground,
      background,
      minimum: NON_TEXT_MINIMUM,
    })),
  ]),
  ...TEXT_ON_FILLS.map(([foreground, background]) => ({
    foreground,
    background,
    minimum: TEXT_MINIMUM,
  })),
]

const tokens = parseTokens(primitives, semantic)

function resolve(name: string, scheme: ColorScheme) {
  const color = resolveColor(tokens, `var(${name})`, scheme)

  if (!color) {
    throw new Error(`${name} does not resolve to an opaque color`)
  }

  return color
}

describe.each(SCHEMES)('%s theme', (scheme) => {
  test.each(PAIRS)(
    '$foreground on $background meets $minimum:1',
    ({ foreground, background, minimum }) => {
      const ratio = contrastRatio(
        resolve(foreground, scheme),
        resolve(background, scheme),
      )

      expect(ratio).toBeGreaterThanOrEqual(minimum)
    },
  )
})

test('every semantic color is covered by a contrast pair or marked decorative', () => {
  const covered = new Set([
    ...DECORATIVE,
    ...PAIRS.flatMap(({ foreground, background }) => [foreground, background]),
  ])
  const semanticColors = [...parseTokens(semantic).keys()].filter((name) =>
    name.startsWith('--color-'),
  )

  expect(semanticColors.filter((name) => !covered.has(name))).toEqual([])
})
