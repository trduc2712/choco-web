import type { CSSProperties, HTMLAttributes } from 'react'

import type { StackGap } from '@/components/stack/stack'
import { cx } from '@/lib/cx'

import styles from './grid.module.scss'

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
        styles.root,
        isAuto ? styles.auto : styles[`columns-${columns}`],
        styles[`gap-${gap}`],
        className,
      )}
      style={gridStyle}
    />
  )
}
