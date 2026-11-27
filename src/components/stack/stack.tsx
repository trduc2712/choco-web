import type { HTMLAttributes } from 'react'

import { cx } from '@/lib/cx'

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
        'stack-root',
        `stack-${direction}`,
        `stack-gap-${gap}`,
        align && `stack-align-${align}`,
        justify && `stack-justify-${justify}`,
        isWrapping && 'stack-wrap',
        className,
      )}
    />
  )
}
