import type { HTMLAttributes } from 'react'

import { cx } from '@/lib/cx'

import styles from './stack.module.scss'

export type StackElement = 'div' | 'ul' | 'ol' | 'section' | 'nav'
export type StackDirection = 'row' | 'column'
export type StackGap = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type StackJustify = 'start' | 'center' | 'end' | 'between'

export type StackProps = HTMLAttributes<HTMLElement> & {
  as?: StackElement
  direction?: StackDirection
  gap?: StackGap
  align?: StackAlign
  justify?: StackJustify
  isWrapping?: boolean
}

export function Stack({
  as: Component = 'div',
  direction = 'column',
  gap = 4,
  align,
  justify,
  isWrapping = false,
  className,
  ...props
}: StackProps) {
  return (
    <Component
      {...props}
      className={cx(
        styles.root,
        styles[direction],
        styles[`gap-${gap}`],
        align && styles[`align-${align}`],
        justify && styles[`justify-${justify}`],
        isWrapping && styles.wrap,
        className,
      )}
    />
  )
}
