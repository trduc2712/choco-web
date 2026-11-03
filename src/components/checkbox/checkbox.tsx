import type { ComponentProps } from 'react'
import { useEffect, useId, useRef } from 'react'

import { Icon } from '@/components/icon/icon'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import styles from './checkbox.module.scss'

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
    <div className={cx(styles.wrapper, className)}>
      <label className={styles.root}>
        <input
          {...props}
          ref={inputRef}
          className={styles.input}
          type="checkbox"
          aria-invalid={isInvalid || undefined}
          aria-describedby={hint ? hintId : undefined}
        />
        <span className={styles.box}>
          <Icon name={isIndeterminate ? 'minus' : 'check'} size="sm" />
        </span>
        {isLabelHidden ? (
          <VisuallyHidden>{label}</VisuallyHidden>
        ) : (
          <span className={styles.text}>{label}</span>
        )}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  )
}
