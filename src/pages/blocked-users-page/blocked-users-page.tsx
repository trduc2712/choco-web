import { useTranslation } from 'react-i18next'

import { HOME_PATH } from '@/constants/routes'
import { BlockedUsersList } from '@/features/blocks'
import { ProfileToolbar } from '@/features/profile'

export function BlockedUsersPage() {
  const { t } = useTranslation()
  return (
    <section>
      <ProfileToolbar
        to={HOME_PATH}
        backLabel={t('postDetail.back')}
        isHeading
        title={t('blocks.title')}
      />
      <BlockedUsersList />
    </section>
  )
}
