import type { ReactNode } from 'react'

import type { HeadingLevel, HeadingSize } from '@/components/heading/heading'
import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Text } from '@/components/text/text'
import { cx } from '@/lib/cx'

import styles from './empty-state.module.scss'

export type EmptyStateSize = 'sm' | 'md' | 'lg'

const HEADING_SIZES: Record<EmptyStateSize, HeadingSize> = {
  sm: 'md',
  md: 'xl',
  lg: '2xl',
}

export type EmptyStateProps = {
  title: string
  description?: string
  icon?: IconName
  size?: EmptyStateSize
  action?: ReactNode
  headingLevel?: HeadingLevel
  role?: 'alert' | 'status'
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  size = 'md',
  action,
  headingLevel = 2,
  role,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(styles.root, styles[size], className)} role={role}>
      {icon && (
        <Icon
          className={styles.icon}
          name={icon}
          size={size === 'sm' ? 'lg' : 'xl'}
        />
      )}
      <Heading level={headingLevel} size={HEADING_SIZES[size]}>
        {title}
      </Heading>
      {description && (
        <Text tone="muted" size={size === 'sm' ? 'sm' : 'md'}>
          {description}
        </Text>
      )}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
