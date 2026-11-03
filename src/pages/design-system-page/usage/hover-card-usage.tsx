import { useTranslation } from 'react-i18next'

import { HoverCard, Link, Text } from '@/components'

export function HoverCardUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <HoverCard
      trigger={<Link to="/people/jane">{t('samples.personName')}</Link>}
    >
      <Text size="sm">{t('samples.hoverCardBio')}</Text>
    </HoverCard>
  )
}
