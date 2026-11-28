import { useTranslation } from 'react-i18next'
import { useLoaderData, useLocation } from 'react-router'

import { SIGN_IN_PATH } from '@/constants/routes'
import { NotFoundState } from '@/features/not-found'
import { FollowListScreen } from '@/features/profile'

import type { followListLoader } from './follow-list-loader'

export function FollowListPage() {
  const { t } = useTranslation()
  const data = useLoaderData<typeof followListLoader>()
  const location = useLocation()
  const signInPath = `${SIGN_IN_PATH}?${new URLSearchParams({ redirect_url: `${location.pathname}${location.search}${location.hash}` })}`

  if (data.status !== 'ready') return <NotFoundState />

  return (
    <section
      aria-label={t('profile.followTabs')}
      className="follow-list-scroll"
    >
      <FollowListScreen
        username={data.username}
        kind={data.kind}
        signInPath={signInPath}
      />
    </section>
  )
}
