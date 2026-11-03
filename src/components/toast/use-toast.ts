import { useContext } from 'react'

import type { ToastContextValue } from './toast-context'
import { ToastContext } from './toast-context'

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider')
  }

  return context
}
