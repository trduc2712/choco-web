import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type { IconSize } from '@/components/icon/icon'
import { Icon } from '@/components/icon/icon'
import styles from '@/components/icon/icon.module.scss'
import {
  getIconsInCategory,
  ICON_CATEGORY_NAMES,
  ICON_NAMES,
  ICON_PATHS,
} from '@/components/icon/icon-paths'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('is hidden from assistive technology by default', () => {
  const { container } = render(<Icon name="heart" />)

  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})

test('is exposed as an image when labelled', async () => {
  const { container } = render(<Icon name="heart" label="Liked" />)

  expect(screen.getByRole('img', { name: 'Liked' })).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

const SIZES: IconSize[] = ['sm', 'md', 'lg', 'xl']

test.each(SIZES)('applies the %s size', (size) => {
  const { container } = render(<Icon name="heart" size={size} />)

  expectStyle(container.querySelector('svg'), styles, size)
})

test.each(ICON_NAMES)('draws the %s icon from its path', (name) => {
  const { container } = render(<Icon name={name} />)

  expect(container.querySelector('path')).toHaveAttribute('d', ICON_PATHS[name])
})

test('lists every icon in exactly one category', () => {
  const categorized = ICON_CATEGORY_NAMES.flatMap((category) =>
    getIconsInCategory(category),
  )

  expect(new Set(categorized).size).toBe(categorized.length)
  expect([...categorized].sort()).toEqual(ICON_NAMES)
})

test.each(ICON_NAMES)(
  'draws %s with plain path commands on the grid',
  (name) => {
    const path = ICON_PATHS[name]
    const numbers = (path.match(/-?\d*\.?\d+/g) ?? []).map(Number)

    expect(path).toMatch(/^M[MLHVCSQTAZmlhvcsqtaz\d\s.,-]+$/)
    expect(numbers.every((value) => Math.abs(value) <= 24)).toBe(true)
  },
)
