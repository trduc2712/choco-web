import type { ReactNode, UIEvent } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import { cx } from '@/lib/cx'

import styles from './scroll-area.module.scss'

export type ScrollAreaOrientation = 'vertical' | 'horizontal'

export type ScrollAreaProps = {
  label: string
  children: ReactNode
  maxHeight?: string
  orientation?: ScrollAreaOrientation
  className?: string
}

type Edges = { start: boolean; end: boolean }

function readEdges(element: HTMLElement, isHorizontal: boolean): Edges {
  const position = isHorizontal ? element.scrollLeft : element.scrollTop
  const size = isHorizontal ? element.clientWidth : element.clientHeight
  const total = isHorizontal ? element.scrollWidth : element.scrollHeight

  return { start: position > 1, end: position + size < total - 1 }
}

export function ScrollArea({
  label,
  children,
  maxHeight,
  orientation = 'vertical',
  className,
}: ScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const isHorizontal = orientation === 'horizontal'
  const [edges, setEdges] = useState<Edges>({ start: false, end: false })
  const isScrollable = edges.start || edges.end

  useLayoutEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const update = () => setEdges(readEdges(viewport, isHorizontal))
    update()

    if (typeof ResizeObserver !== 'function') {
      return
    }

    const observer = new ResizeObserver(update)
    observer.observe(viewport)

    return () => observer.disconnect()
  }, [isHorizontal])

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    setEdges(readEdges(event.currentTarget, isHorizontal))
  }

  return (
    <div
      className={cx(
        styles.root,
        styles[orientation],
        edges.start && styles.atStart,
        edges.end && styles.atEnd,
        className,
      )}
    >
      <div
        ref={viewportRef}
        className={styles.viewport}
        style={{ maxHeight }}
        role="region"
        aria-label={label}
        // Only a scrollable region needs to be reachable with the keyboard.
        tabIndex={isScrollable ? 0 : undefined}
        onScroll={handleScroll}
      >
        {children}
      </div>
    </div>
  )
}
