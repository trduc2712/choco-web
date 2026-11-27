import type { ComponentProps } from 'react'

import { cx } from '@/lib/cx'

export type VisuallyHiddenProps = ComponentProps<'span'>

export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  return <span {...props} className={cx('visually-hidden-root', className)} />
}
