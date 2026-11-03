import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'

import type { ToastContextValue, ToastOptions } from './toast-context'
import { ToastContext } from './toast-context'
import styles from './toast-provider.module.scss'

const DEFAULT_DURATION_MS = 6000

type ToastRecord = ToastOptions & { id: string }

type ToastItemProps = {
  toast: ToastRecord
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isPaused, setIsPaused] = useState(false)
  const duration =
    toast.duration === undefined ? DEFAULT_DURATION_MS : toast.duration

  useEffect(() => {
    if (duration === null || isPaused) {
      return
    }

    const timeout = setTimeout(() => onDismiss(toast.id), duration)

    return () => clearTimeout(timeout)
  }, [duration, isPaused, onDismiss, toast.id])

  return (
    <div
      className={styles.toast}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <Alert
        tone={toast.tone}
        variant="outline"
        title={toast.title}
        role={toast.tone === 'danger' ? 'alert' : 'status'}
        onDismiss={() => onDismiss(toast.id)}
      >
        {toast.description}
      </Alert>
    </div>
  )
}

export type ToastProviderProps = {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { t } = useTranslation()
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextId = useRef(0)

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((options: ToastOptions) => {
    nextId.current += 1
    const id = `toast-${nextId.current}`

    setToasts((current) => [...current, { ...options, id }])

    return id
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  )

  return (
    <ToastContext value={value}>
      {children}
      <div
        className={styles.viewport}
        role="region"
        aria-label={t('toast.label')}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext>
  )
}
