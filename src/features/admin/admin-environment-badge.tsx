import { useTranslation } from 'react-i18next'

import type { BadgeTone } from '@/components/badge/badge'
import { Badge } from '@/components/badge/badge'
import type { AppEnvironment } from '@/config/env'
import { env } from '@/config/env'

const TONES: Record<AppEnvironment, BadgeTone> = {
  local: 'neutral',
  staging: 'warning',
  production: 'danger',
}

// Which deployment the admin is looking at, so nobody acts on production
// thinking it is staging.
export function AdminEnvironmentBadge({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <Badge className={className} tone={TONES[env.appEnv]} size="sm">
      {t(`admin.environment.${env.appEnv}`)}
    </Badge>
  )
}
