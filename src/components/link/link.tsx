import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import type { LinkProps as RouterLinkProps } from 'react-router'
import { Link as RouterLink } from 'react-router'

import { Icon } from '@/components/icon/icon'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import styles from './link.module.scss'

export type LinkVariant = 'inline' | 'standalone' | 'subtle'

type LinkBaseProps = {
  variant?: LinkVariant
}

type InternalLinkProps = RouterLinkProps & LinkBaseProps & { href?: never }

type ExternalLinkProps = Omit<ComponentProps<'a'>, 'target' | 'rel'> &
  LinkBaseProps & {
    href: string
  }

export type LinkProps = InternalLinkProps | ExternalLinkProps

export function Link(props: LinkProps) {
  const { t } = useTranslation()

  if (props.href !== undefined) {
    const { variant = 'inline', className, children, ...rest } = props

    return (
      <a
        {...rest}
        className={cx(styles.root, styles[variant], className)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        <Icon className={styles.icon} name="external-link" size="sm" />
        <VisuallyHidden>{t('common.opensInNewTab')}</VisuallyHidden>
      </a>
    )
  }

  const { variant = 'inline', className, ...rest } = props

  return (
    <RouterLink
      {...rest}
      className={cx(styles.root, styles[variant], className)}
    />
  )
}
