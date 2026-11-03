import { useTranslation } from 'react-i18next'

import { DescriptionList } from '@/components'

export function DescriptionListUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <DescriptionList
      isDivided
      items={[
        {
          id: 'username',
          term: t('samples.usernameTerm'),
          description: 'username',
        },
        {
          id: 'email',
          term: t('samples.emailTerm'),
          description: 'user@example.com',
        },
      ]}
    />
  )
}
