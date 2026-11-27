import type { HTMLAttributes } from 'react'

import { cx } from '@/lib/cx'

export type AspectRatioProps = HTMLAttributes<HTMLDivElement> & {
  ratio?: number
}

export function AspectRatio({
  ratio = 16 / 9,
  className,
  style,
  ...props
}: AspectRatioProps) {
  return (
    <div
      {...props}
      className={cx('aspect-ratio-root', className)}
      style={{ ...style, aspectRatio: ratio }}
    />
  )
}
