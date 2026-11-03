import type { ComponentProps, ReactNode } from 'react'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './toggle-button.module.scss'

export type ToggleButtonSize = 'sm' | 'md'

type ToggleButtonBaseProps = Omit<
  ComponentProps<'button'>,
  'children' | 'onChange' | 'aria-pressed'
> & {
  isPressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (isPressed: boolean) => void
  size?: ToggleButtonSize
}

type LabelledToggleButtonProps = ToggleButtonBaseProps & {
  children: ReactNode
  icon?: IconName
}

type IconOnlyToggleButtonProps = ToggleButtonBaseProps & {
  icon: IconName
  'aria-label': string
  children?: never
}

export type ToggleButtonProps =
  LabelledToggleButtonProps | IconOnlyToggleButtonProps

export function ToggleButton({
  isPressed: isPressedProp,
  defaultPressed = false,
  onPressedChange,
  size = 'md',
  icon,
  className,
  children,
  onClick,
  ...props
}: ToggleButtonProps) {
  const [isPressed, setIsPressed] = useControllableState({
    value: isPressedProp,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  })

  return (
    <button
      {...props}
      type="button"
      className={cx(
        styles.root,
        styles[size],
        !children && styles.iconOnly,
        className,
      )}
      aria-pressed={isPressed}
      onClick={(event) => {
        onClick?.(event)
        setIsPressed(!isPressed)
      }}
    >
      {icon && <Icon name={icon} size="sm" />}
      {children}
    </button>
  )
}
