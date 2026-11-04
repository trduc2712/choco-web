import type { ReactNode } from 'react'

import { Alert } from '@/components/alert/alert'
import { Card } from '@/components/card/card'
import { Heading } from '@/components/heading/heading'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'

import styles from './auth-card.module.scss'

export type AuthCardProps = {
  title: string
  description?: ReactNode
  error?: string
  footer?: ReactNode
  children?: ReactNode
}

export function AuthCard({
  title,
  description,
  error,
  footer,
  children,
}: AuthCardProps) {
  return (
    <main className={styles.page}>
      <Card className={styles.card} padding="lg">
        <Stack gap={5}>
          <Stack gap={2}>
            <Heading level={1} size="xl">
              {title}
            </Heading>
            {description && <Text tone="muted">{description}</Text>}
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
      </Card>
    </main>
  )
}
