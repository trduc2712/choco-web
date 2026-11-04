import { useSearchParams } from 'react-router'

import { getSafeRedirectPath, REDIRECT_PARAM } from './redirect'

export function useRedirectPath(): string {
  const [searchParams] = useSearchParams()

  return getSafeRedirectPath(searchParams.get(REDIRECT_PARAM))
}
