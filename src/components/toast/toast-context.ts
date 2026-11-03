import { createContext } from 'react'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export type ToastOptions = {
  title: string
  description?: string
  tone?: ToastTone
  duration?: number | null
}

export type ToastContextValue = {
  showToast: (options: ToastOptions) => string
  dismissToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
