import type { ReactNode } from 'react'

import { Alert } from '@/components/alert/alert'
import { Heading } from '@/components/heading/heading'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'
import { cx } from '@/lib/cx'

import styles from './auth-card.module.scss'

export type AuthCardProps = {
  title: string
  description?: ReactNode
  error?: string
  footer?: ReactNode
  children?: ReactNode
  layout?: 'form' | 'verification'
}

export function AuthCard({
  title,
  description,
  error,
  footer,
  children,
  layout = 'form',
}: AuthCardProps) {
  const isVerification = layout === 'verification'

  return (
    <main className={styles.page}>
      <div className={cx(styles.card, isVerification && styles.verification)}>
        <Stack gap={isVerification ? 6 : 5}>
          <Stack
            gap={isVerification ? 3 : 2}
            className={isVerification ? styles.intro : undefined}
          >
            <Heading level={1} size="xl">
              {title}
            </Heading>
            {description && (
              <Text tone="muted" size={isVerification ? 'sm' : 'md'}>
                {description}
              </Text>
            )}
          </Stack>
          {error && (
            <Alert tone="danger" role="alert">
              {error}
            </Alert>
          )}
          {children}
          {footer && (
            <Text size="sm" tone="muted" align="center">
              {footer}
            </Text>
          )}
        </Stack>
      </div>
    </main>
  )
}
