import type { ChangeEvent, KeyboardEvent } from 'react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import type { InputProps } from '@/components/input/input'
import { Input } from '@/components/input/input'
import { useControllableState } from '@/hooks/use-controllable-state'

export type SearchInputProps = Omit<
  InputProps,
  'type' | 'trailing' | 'icon' | 'value' | 'defaultValue' | 'onChange'
> & {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
}

export function SearchInput({
  value: valueProp,
  defaultValue = '',
  onChange,
  onSearch,
  onKeyDown,
  disabled,
  ...props
}: SearchInputProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })

  function clear() {
    setValue('')
    onSearch?.('')
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)

    if (event.key === 'Enter') {
      onSearch?.(value)
    } else if (event.key === 'Escape' && value) {
      event.preventDefault()
      clear()
    }
  }

  return (
    <Input
      {...props}
      ref={inputRef}
      type="search"
      icon="search"
      autoComplete="off"
      value={value}
      disabled={disabled}
      trailing={
        value && !disabled ? (
          <Button
            icon="close"
            variant="ghost"
            size="sm"
            aria-label={t('searchInput.clear')}
            onClick={clear}
          />
        ) : undefined
      }
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        setValue(event.target.value)
      }
      onKeyDown={handleKeyDown}
    />
  )
}
