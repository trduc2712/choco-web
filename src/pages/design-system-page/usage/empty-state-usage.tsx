import { useTranslation } from 'react-i18next'

import { Button, EmptyState } from '@/components'

export function EmptyStateUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <EmptyState
      icon="inbox"
      headingLevel={3}
      title={t('samples.emptyTitle')}
      description={t('samples.emptyDescription')}
      action={<Button iconStart="plus">{t('samples.emptyAction')}</Button>}
    />
  )
}
