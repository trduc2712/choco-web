import { useTranslation } from 'react-i18next'

import { env } from '@/config/env'

// Which deployment the admin is looking at, so nobody acts on production
// thinking it is staging.
export function AdminEnvironmentBadge({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <span className={className}>{t(`admin.environment.${env.appEnv}`)}</span>
  )
}
