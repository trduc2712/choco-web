import type { ComponentProps } from 'react'
import { useEffect, useId, useRef } from 'react'

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
    <div className={className}>
      <label>
        <input
          {...props}
          ref={inputRef}
          type="checkbox"
          aria-invalid={isInvalid || undefined}
          aria-describedby={hint ? hintId : undefined}
        />
        {isLabelHidden ? (
          <span className="visually-hidden">{label}</span>
        ) : (
          <span>{label}</span>
        )}
      </label>
      {hint && <p id={hintId}>{hint}</p>}
    </div>
  )
}
