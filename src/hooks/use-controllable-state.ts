import { useCallback, useState } from 'react'

type ControllableStateOptions<T> = {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internalValue

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setInternalValue(next)
      }

      onChange?.(next)
    },
    [isControlled, onChange],
  )

  return [current, setValue]
}
