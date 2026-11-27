import type { ComponentProps } from 'react'
import { useEffect, useId, useRef } from 'react'

import { Icon } from '@/components/icon/icon'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'ref'> & {
  label: string
  hint?: string
  isIndeterminate?: boolean
  isInvalid?: boolean
  isLabelHidden?: boolean
}

export function Checkbox({
  label,
  hint,
  isIndeterminate = false,
  isInvalid = false,
  isLabelHidden = false,
  className,
  ...props
}: CheckboxProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  return (
    <div className={cx('checkbox-wrapper', className)}>
      <label className="checkbox-root">
        <input
          {...props}
          ref={inputRef}
          className="checkbox-input"
          type="checkbox"
          aria-invalid={isInvalid || undefined}
          aria-describedby={hint ? hintId : undefined}
        />
        <span className="checkbox-box">
          <Icon name={isIndeterminate ? 'minus' : 'check'} size="sm" />
        </span>
        {isLabelHidden ? (
          <VisuallyHidden>{label}</VisuallyHidden>
        ) : (
          <span className="checkbox-text">{label}</span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="checkbox-hint">
          {hint}
        </p>
      )}
    </div>
  )
}
