import { expect, test } from 'vitest'

import { computePosition, parsePlacement } from '@/hooks/use-floating'

const VIEWPORT = { width: 1000, height: 800 }
const ANCHOR = { top: 300, left: 400, width: 100, height: 40 }
const FLOATING = { width: 200, height: 100 }

test('splits a placement into side and alignment', () => {
  expect(parsePlacement('bottom-start')).toEqual(['bottom', 'start'])
  expect(parsePlacement('left')).toEqual(['left', undefined])
})

test('centers below the anchor', () => {
  expect(computePosition(ANCHOR, FLOATING, 'bottom', 4, VIEWPORT)).toEqual({
    side: 'bottom',
    top: 344,
    left: 350,
  })
})

test('aligns to the start and end edges', () => {
  expect(
    computePosition(ANCHOR, FLOATING, 'top-start', 4, VIEWPORT),
  ).toMatchObject({ side: 'top', top: 196, left: 400 })
  expect(
    computePosition(ANCHOR, FLOATING, 'top-end', 4, VIEWPORT),
  ).toMatchObject({ left: 300 })
})

test('places beside the anchor', () => {
  expect(computePosition(ANCHOR, FLOATING, 'right', 4, VIEWPORT)).toEqual({
    side: 'right',
    top: 270,
    left: 504,
  })
})

test('flips to the opposite side when there is no room', () => {
  const nearTop = { ...ANCHOR, top: 20 }

  expect(computePosition(nearTop, FLOATING, 'top', 4, VIEWPORT).side).toBe(
    'bottom',
  )
})

test('shifts back inside the viewport', () => {
  const nearLeft = { ...ANCHOR, left: 0 }

  expect(computePosition(nearLeft, FLOATING, 'bottom', 4, VIEWPORT).left).toBe(
    8,
  )
})
