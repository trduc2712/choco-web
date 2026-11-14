import { useLoaderData, useLocation } from 'react-router'

import { SIGN_IN_PATH } from '@/constants/routes'
import { NotFoundState } from '@/features/not-found'
import { ProfileScreen } from '@/features/profile'

import type { profileLoader } from './profile-loader'

export function ProfilePage() {
  const data = useLoaderData<typeof profileLoader>()
  const location = useLocation()
  const signInPath = `${SIGN_IN_PATH}?${new URLSearchParams({ redirect_url: `${location.pathname}${location.search}${location.hash}` })}`

  return (
    <div key={location.pathname} data-profile-page="">
      {data.status === 'ready' ? (
        <ProfileScreen username={data.username} signInPath={signInPath} />
      ) : (
        <NotFoundState />
      )}
    </div>
  )
}
