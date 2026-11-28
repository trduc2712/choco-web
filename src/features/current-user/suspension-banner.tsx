import { useTranslation } from 'react-i18next'

import { formatSuspensionDate } from './suspension-format'
import { useSuspension } from './use-suspension'

// Shown on every page while the viewer is suspended, and gone once an
// administrator lifts it.
export function SuspensionBanner() {
  const { t, i18n } = useTranslation()
  const { suspension } = useSuspension()

  if (!suspension) return null

  return (
    <div role="status">
      <strong>{t('suspension.title')}</strong>
      {t('suspension.reasonSince', {
        reason: suspension.reason,
        date: formatSuspensionDate(suspension.suspendedAt, i18n.language),
      })}{' '}
      {t('suspension.readOnly')}
    </div>
  )
}
