import type { KeyboardEvent } from 'react'
import { useRef, useState } from 'react'

import type { IconName } from '@/components/icon/icon-paths'
import type { ToggleButtonSize } from '@/components/toggle-button/toggle-button'
import { ToggleButton } from '@/components/toggle-button/toggle-button'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './toggle-group.module.scss'

export type ToggleGroupItem = {
  value: string
  label: string
  icon?: IconName
  isLabelHidden?: boolean
  isDisabled?: boolean
}

export type ToggleGroupProps = {
  label: string
  items: ToggleGroupItem[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  isMultiple?: boolean
  size?: ToggleButtonSize
  className?: string
}

export function ToggleGroup({
  label,
  items,
  value: valueProp,
  defaultValue = [],
  onChange,
  isMultiple = false,
  size = 'md',
  className,
}: ToggleGroupProps) {
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())
  const enabled = items.filter((item) => !item.isDisabled)
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [focusValue, setFocusValue] = useState(
    () =>
      value.find((item) => enabled.some((e) => e.value === item)) ??
      enabled[0]?.value,
  )

  function toggle(itemValue: string) {
    const isPressed = value.includes(itemValue)

    if (isMultiple) {
      setValue(
        isPressed
          ? value.filter((current) => current !== itemValue)
          : [...value, itemValue],
      )
    } else {
      setValue(isPressed ? [] : [itemValue])
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = enabled.findIndex((item) => item.value === focusValue)
    const lastIndex = enabled.length - 1
    const nextIndex = {
      ArrowRight: index === lastIndex ? 0 : index + 1,
      ArrowLeft: index <= 0 ? lastIndex : index - 1,
      Home: 0,
      End: lastIndex,
    }[event.key]
    const next = nextIndex === undefined ? undefined : enabled[nextIndex]

    if (next) {
      event.preventDefault()
      setFocusValue(next.value)
      itemRefs.current.get(next.value)?.focus()
    }
  }

  return (
    <div
      className={cx(styles.root, className)}
      role="group"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => {
        const shared = {
          ref: (element: HTMLButtonElement | null) => {
            if (element) {
              itemRefs.current.set(item.value, element)
            } else {
              itemRefs.current.delete(item.value)
            }
          },
          className: styles.item,
          size,
          isPressed: value.includes(item.value),
          disabled: item.isDisabled,
          tabIndex: item.value === focusValue ? 0 : -1,
          onFocus: () => setFocusValue(item.value),
          onPressedChange: () => toggle(item.value),
        }

        return item.icon && item.isLabelHidden ? (
          <ToggleButton
            key={item.value}
            {...shared}
            icon={item.icon}
            aria-label={item.label}
          />
        ) : (
          <ToggleButton key={item.value} {...shared} icon={item.icon}>
            {item.label}
          </ToggleButton>
        )
      })}
    </div>
  )
}
