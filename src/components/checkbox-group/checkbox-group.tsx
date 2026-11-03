import { Checkbox } from '@/components/checkbox/checkbox'
import { Fieldset } from '@/components/fieldset/fieldset'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './checkbox-group.module.scss'

export type CheckboxGroupOption = {
  value: string
  label: string
  hint?: string
  isDisabled?: boolean
}

export type CheckboxGroupOrientation = 'vertical' | 'horizontal'

export type CheckboxGroupProps = {
  label: string
  name: string
  options: CheckboxGroupOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  hint?: string
  error?: string
  isRequired?: boolean
  orientation?: CheckboxGroupOrientation
  className?: string
}

export function CheckboxGroup({
  label,
  name,
  options,
  value: valueProp,
  defaultValue = [],
  onChange,
  hint,
  error,
  isRequired = false,
  orientation = 'vertical',
  className,
}: CheckboxGroupProps) {
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })

  function toggle(optionValue: string, isChecked: boolean) {
    setValue(
      isChecked
        ? options
            .map((option) => option.value)
            .filter((item) => item === optionValue || value.includes(item))
        : value.filter((item) => item !== optionValue),
    )
  }

  return (
    <Fieldset
      legend={label}
      hint={hint}
      error={error}
      isRequired={isRequired}
      className={className}
    >
      <div className={cx(styles.options, styles[orientation])}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            hint={option.hint}
            checked={value.includes(option.value)}
            disabled={option.isDisabled}
            isInvalid={Boolean(error)}
            onChange={(event) => toggle(option.value, event.target.checked)}
          />
        ))}
      </div>
    </Fieldset>
  )
}
