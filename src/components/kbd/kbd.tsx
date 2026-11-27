import type { ComponentProps } from 'react'

import { cx } from '@/lib/cx'

export type KbdProps = ComponentProps<'kbd'>

export function Kbd({ className, ...props }: KbdProps) {
  return <kbd {...props} className={cx('kbd-root', className)} />
}
