import type { CSSProperties } from 'react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export type FloatingSide = 'top' | 'right' | 'bottom' | 'left'
export type FloatingAlign = 'start' | 'end'
export type FloatingPlacement =
  FloatingSide | `${FloatingSide}-${FloatingAlign}`

type Rect = { top: number; left: number; width: number; height: number }
type Size = { width: number; height: number }

const OPPOSITE: Record<FloatingSide, FloatingSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const VIEWPORT_PADDING = 8

export function parsePlacement(
  placement: FloatingPlacement,
): [FloatingSide, FloatingAlign | undefined] {
  const [side, align] = placement.split('-') as [
    FloatingSide,
    FloatingAlign | undefined,
  ]

  return [side, align]
}

function place(
  anchor: Rect,
  floating: Size,
  side: FloatingSide,
  align: FloatingAlign | undefined,
  offset: number,
) {
  const isVertical = side === 'top' || side === 'bottom'
  let top: number
  let left: number

  if (isVertical) {
    top =
      side === 'top'
        ? anchor.top - floating.height - offset
        : anchor.top + anchor.height + offset
    left =
      align === 'start'
        ? anchor.left
        : align === 'end'
          ? anchor.left + anchor.width - floating.width
          : anchor.left + (anchor.width - floating.width) / 2
  } else {
    left =
      side === 'left'
        ? anchor.left - floating.width - offset
        : anchor.left + anchor.width + offset
    top =
      align === 'start'
        ? anchor.top
        : align === 'end'
          ? anchor.top + anchor.height - floating.height
          : anchor.top + (anchor.height - floating.height) / 2
  }

  return { top, left }
}

function overflowOnSide(
  position: { top: number; left: number },
  floating: Size,
  side: FloatingSide,
  viewport: Size,
) {
  return {
    top: VIEWPORT_PADDING - position.top,
    bottom:
      position.top + floating.height - (viewport.height - VIEWPORT_PADDING),
    left: VIEWPORT_PADDING - position.left,
    right: position.left + floating.width - (viewport.width - VIEWPORT_PADDING),
  }[side]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

export function computePosition(
  anchor: Rect,
  floating: Size,
  placement: FloatingPlacement,
  offset: number,
  viewport: Size,
) {
  const [preferredSide, align] = parsePlacement(placement)
  let side = preferredSide
  let position = place(anchor, floating, side, align, offset)

  if (overflowOnSide(position, floating, side, viewport) > 0) {
    const flipped = OPPOSITE[side]
    const flippedPosition = place(anchor, floating, flipped, align, offset)

    if (
      overflowOnSide(flippedPosition, floating, flipped, viewport) <
      overflowOnSide(position, floating, side, viewport)
    ) {
      side = flipped
      position = flippedPosition
    }
  }

  const isVertical = side === 'top' || side === 'bottom'
  const max = {
    left: viewport.width - floating.width - VIEWPORT_PADDING,
    top: viewport.height - floating.height - VIEWPORT_PADDING,
  }

  return {
    side,
    top: isVertical
      ? position.top
      : clamp(position.top, VIEWPORT_PADDING, max.top),
    left: isVertical
      ? clamp(position.left, VIEWPORT_PADDING, max.left)
      : position.left,
  }
}

const TRANSFORM_ORIGIN: Record<FloatingSide, string> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

type FloatingOptions = {
  isOpen: boolean
  placement: FloatingPlacement
  offset?: number
}

export function useFloating<
  Anchor extends HTMLElement = HTMLElement,
  Floating extends HTMLElement = HTMLElement,
>({ isOpen, placement, offset = 4 }: FloatingOptions) {
  const anchorRef = useRef<Anchor>(null)
  const floatingRef = useRef<Floating>(null)
  const [floatingNode, setFloatingNode] = useState<Floating | null>(null)
  const setFloating = useCallback((node: Floating | null) => {
    floatingRef.current = node
    setFloatingNode(node)
  }, [])
  const [state, setState] = useState<{
    side: FloatingSide
    top: number
    left: number
  }>()

  const update = useCallback(() => {
    const anchor = anchorRef.current
    const floating = floatingRef.current

    if (!anchor || !floating) {
      return
    }

    const anchorRect = anchor.getBoundingClientRect()
    const next = computePosition(
      anchorRect,
      { width: floating.offsetWidth, height: floating.offsetHeight },
      placement,
      offset,
      { width: window.innerWidth, height: window.innerHeight },
    )

    setState((current) =>
      current &&
      current.side === next.side &&
      current.top === next.top &&
      current.left === next.left
        ? current
        : next,
    )
  }, [placement, offset])

  useLayoutEffect(() => {
    if (!isOpen || !floatingNode) {
      return
    }

    update()

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null

    if (anchorRef.current) {
      observer?.observe(anchorRef.current)
    }

    observer?.observe(floatingNode)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      observer?.disconnect()
    }
  }, [isOpen, floatingNode, update])

  // A closed element keeps no position, so reopening never shows a stale one.
  const position = isOpen && floatingNode ? state : undefined
  const [preferredSide] = parsePlacement(placement)
  const side = position?.side ?? preferredSide
  const style: CSSProperties = {
    position: 'fixed',
    top: position?.top ?? 0,
    left: position?.left ?? 0,
    transformOrigin: TRANSFORM_ORIGIN[side],
    // Opacity rather than visibility, so content can take focus right away.
    opacity: isOpen && !position ? 0 : undefined,
  }

  return { anchorRef, floatingRef, setFloating, style, side, update }
}
