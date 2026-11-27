import type { CSSProperties, HTMLAttributes } from 'react'

import type { StackGap } from '@/components/stack/stack'
import { cx } from '@/lib/cx'

export type GridElement = 'div' | 'ul' | 'ol' | 'section'
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12

export type GridProps = HTMLAttributes<HTMLElement> & {
  as?: GridElement
  columns?: GridColumns
  minItemWidth?: string
  gap?: StackGap
}

type GridStyle = CSSProperties & { '--grid-min'?: string }

export function Grid({
  as: Component = 'div',
  columns,
  minItemWidth,
  gap = 4,
  className,
  style,
  ...props
}: GridProps) {
  const isAuto = columns === undefined
  const gridStyle: GridStyle = {
    ...style,
    '--grid-min': isAuto ? minItemWidth : undefined,
  }

  return (
    <Component
      {...props}
      className={cx(
        'grid-root',
        isAuto ? 'grid-auto' : `grid-columns-${columns}`,
        `grid-gap-${gap}`,
        className,
      )}
      style={gridStyle}
    />
  )
}
