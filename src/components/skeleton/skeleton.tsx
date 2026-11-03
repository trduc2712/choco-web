import { cx } from '@/lib/cx'

import styles from './skeleton.module.scss'

export type SkeletonShape = 'text' | 'rect' | 'circle'

export type SkeletonProps = {
  shape?: SkeletonShape
  width?: string
  height?: string
  lines?: number
  isAnimated?: boolean
  className?: string
}

export function Skeleton({
  shape = 'text',
  width,
  height,
  lines = 1,
  isAnimated = true,
  className,
}: SkeletonProps) {
  const blockClassName = cx(
    styles.root,
    styles[shape],
    isAnimated && styles.animated,
  )

  if (shape === 'text' && lines > 1) {
    return (
      <span
        className={cx(styles.lines, className)}
        style={{ width }}
        aria-hidden="true"
      >
        {Array.from({ length: lines }, (_, index) => (
          <span key={index} className={blockClassName} style={{ height }} />
        ))}
      </span>
    )
  }

  return (
    <span
      className={cx(blockClassName, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
