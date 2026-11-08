import type { LoaderFunctionArgs } from 'react-router'

import type { FollowListKind } from '@/features/profile'

import { profileLoader } from '../profile-page/profile-loader'

export function followListLoader(args: LoaderFunctionArgs) {
  const profile = profileLoader(args)
  const kind = args.params.list as FollowListKind | undefined
  if (profile.status !== 'ready') return profile
  if (kind !== 'followers' && kind !== 'following') {
    return { status: 'not-found' as const }
  }
  return { ...profile, kind }
}
