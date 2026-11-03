import type { KeyboardEvent } from 'react'
import { useRef } from 'react'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './segmented-control.module.scss'

export type SegmentedControlSize = 'sm' | 'md'

export type SegmentedControlOption = {
  value: string
  label: string
  icon?: IconName
  isLabelHidden?: boolean
  isDisabled?: boolean
}

export type SegmentedControlProps = {
  label: string
  options: SegmentedControlOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  size?: SegmentedControlSize
  isFullWidth?: boolean
  className?: string
}

export function SegmentedControl({
  label,
  options,
  value: valueProp,
  defaultValue,
  onChange,
  size = 'md',
  isFullWidth = false,
  className,
}: SegmentedControlProps) {
  const optionRefs = useRef(new Map<string, HTMLButtonElement>())
  const enabled = options.filter((option) => !option.isDisabled)
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? enabled[0]?.value ?? '',
    onChange,
  })

  function select(next: string) {
    setValue(next)
    optionRefs.current.get(next)?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = enabled.findIndex((option) => option.value === value)
    const lastIndex = enabled.length - 1
    const nextIndex = {
      ArrowRight: index === lastIndex ? 0 : index + 1,
      ArrowDown: index === lastIndex ? 0 : index + 1,
      ArrowLeft: index <= 0 ? lastIndex : index - 1,
      ArrowUp: index <= 0 ? lastIndex : index - 1,
      Home: 0,
      End: lastIndex,
    }[event.key]
    const next = nextIndex === undefined ? undefined : enabled[nextIndex]

    if (next) {
      event.preventDefault()
      select(next.value)
    }
  }

  return (
    <div
      className={cx(
        styles.root,
        styles[size],
        isFullWidth && styles.fullWidth,
        className,
      )}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <button
            key={option.value}
            ref={(element) => {
              if (element) {
                optionRefs.current.set(option.value, element)
              } else {
                optionRefs.current.delete(option.value)
              }
            }}
            className={styles.option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.isLabelHidden ? option.label : undefined}
            tabIndex={isSelected ? 0 : -1}
            disabled={option.isDisabled}
            onClick={() => select(option.value)}
          >
            {option.icon && <Icon name={option.icon} size="sm" />}
            {!option.isLabelHidden && option.label}
          </button>
        )
      })}
    </div>
  )
}
