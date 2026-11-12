import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { useToast } from '@/components/toast/use-toast'
import type { ApiError } from '@/lib/api-client'
import { ApiSuspendedContext } from '@/lib/api-session'

import { formatSuspensionDate } from './suspension-format'
import { useRefreshCurrentUser } from './use-current-user'

// Handles `403 User.Suspended` once for every request. It tells the person why
// (the reason and the date, never a generic "forbidden"), and asks GET /me
// again so the notice and the disabled controls follow. It does not retry the
// request and does not sign anyone out. Mount it inside the toast and query
// providers.
export function SuspensionProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const refreshCurrentUser = useRefreshCurrentUser()

  const handle = useCallback(
    (error: ApiError) => {
      const { suspension } = error
      showToast({
        tone: 'danger',
        title: t('suspension.refused'),
        description: suspension
          ? t('suspension.reasonSince', {
              reason: suspension.reason,
              date: formatSuspensionDate(suspension.suspendedAt, i18n.language),
            })
          : undefined,
      })
      void refreshCurrentUser()
    },
    [i18n.language, refreshCurrentUser, showToast, t],
  )

  return <ApiSuspendedContext value={handle}>{children}</ApiSuspendedContext>
}
