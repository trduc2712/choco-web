import type { ComponentProps, MouseEvent, ReactNode } from 'react'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Spinner } from '@/components/spinner/spinner'
import { cx } from '@/lib/cx'

import styles from './button.module.scss'

export type ButtonVariant =
  'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonShape = 'default' | 'pill'

type ButtonBaseProps = Omit<ComponentProps<'button'>, 'children'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  isLoading?: boolean
  isFullWidth?: boolean
}

type LabelledButtonProps = ButtonBaseProps & {
  children: ReactNode
  iconStart?: IconName
  iconEnd?: IconName
  icon?: never
}

type IconOnlyButtonProps = ButtonBaseProps & {
  icon: IconName
  'aria-label': string
  children?: never
  iconStart?: never
  iconEnd?: never
}

export type ButtonProps = LabelledButtonProps | IconOnlyButtonProps

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  isLoading = false,
  isFullWidth = false,
  type = 'button',
  icon,
  iconStart,
  iconEnd,
  className,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const iconSize = size === 'sm' ? 'sm' : 'md'
  const leadingIcon = icon ?? iconStart

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isLoading) {
      event.preventDefault()
      return
    }

    onClick?.(event)
  }

  return (
    <button
      {...props}
      type={type}
      className={cx(
        styles.root,
        styles[variant],
        styles[size],
        shape === 'pill' && styles.pill,
        icon && styles.iconOnly,
        isFullWidth && styles.fullWidth,
        className,
      )}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || undefined}
      onClick={handleClick}
    >
      {isLoading ? (
        <Spinner size="sm" isDecorative />
      ) : (
        leadingIcon && <Icon name={leadingIcon} size={iconSize} />
      )}
      {children}
      {iconEnd && <Icon name={iconEnd} size={iconSize} />}
    </button>
  )
}
