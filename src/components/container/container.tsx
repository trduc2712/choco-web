import type { HTMLAttributes } from 'react'

import { cx } from '@/lib/cx'

export type ContainerElement = 'div' | 'main' | 'section'

export type ContainerSize = 'sm' | 'md' | 'lg' | 'full'

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ContainerElement
  size?: ContainerSize
}

export function Container({
  as: Component = 'div',
  size = 'lg',
  className,
  ...props
}: ContainerProps) {
  return (
    <Component
      {...props}
      className={cx(
        'container-root',
        size !== 'full' && `container-${size}`,
        className,
      )}
    />
  )
}
