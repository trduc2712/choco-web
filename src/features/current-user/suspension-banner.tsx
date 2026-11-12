import { useTranslation } from 'react-i18next'

import { Banner } from '@/components/banner/banner'

import { formatSuspensionDate } from './suspension-format'
import { useSuspension } from './use-suspension'

// Shown on every page while the viewer is suspended, and gone once an
// administrator lifts it.
export function SuspensionBanner() {
  const { t, i18n } = useTranslation()
  const { suspension } = useSuspension()

  if (!suspension) return null

  return (
    <Banner tone="danger" role="status" title={t('suspension.title')}>
      {t('suspension.reasonSince', {
        reason: suspension.reason,
        date: formatSuspensionDate(suspension.suspendedAt, i18n.language),
      })}{' '}
      {t('suspension.readOnly')}
    </Banner>
  )
}
