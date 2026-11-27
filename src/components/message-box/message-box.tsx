import type { CSSProperties, ReactNode } from 'react'

import { cx } from '@/lib/cx'

export type MessageBoxProps = {
  children: ReactNode
  // A small line under the message, such as a short id or a time.
  meta?: ReactNode
  // Cuts the message after this many lines. Left out, it shows in full.
  lines?: number
  // Makes the whole box a button.
  onClick?: () => void
  className?: string
}

// A quoted piece of someone's message: a quiet box with the text and, under
// it, an optional line of meta. It carries no author; put a UserCard beside it.
export function MessageBox({
  children,
  meta,
  lines,
  onClick,
  className,
}: MessageBoxProps) {
  const content = (
    <>
      <span
        className={cx(
          'message-box-text',
          lines !== undefined && 'message-box-clamped',
        )}
      >
        {children}
      </span>
      {meta ? <span className="message-box-meta">{meta}</span> : null}
    </>
  )
  const style =
    lines === undefined
      ? undefined
      : ({ '--message-box-lines': lines } as CSSProperties)

  return onClick ? (
    <button
      className={cx('message-box-root', 'message-box-interactive', className)}
      style={style}
      type="button"
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <div className={cx('message-box-root', className)} style={style}>
      {content}
    </div>
  )
}
