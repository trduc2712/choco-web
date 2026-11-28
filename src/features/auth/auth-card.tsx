import type { ReactNode } from 'react'

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
}: AuthCardProps) {
  return (
    <main>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {error && <p role="alert">{error}</p>}
      {children}
      {footer && <footer>{footer}</footer>}
    </main>
  )
}
