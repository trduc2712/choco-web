import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { HOME_PATH } from '@/constants/routes'
import { ProfileToolbar } from '@/features/profile'
import { UserSearchResults, UserSearchTitle } from '@/features/user-search'

export function UserSearchPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  return (
    <section>
      <ProfileToolbar
        to={HOME_PATH}
        backLabel={t('postDetail.back')}
        isHeading
        title={
          <UserSearchTitle query={query}>
            {t('userSearch.resultsTitle')}
          </UserSearchTitle>
        }
      />
      <UserSearchResults query={query} />
    </section>
  )
}
