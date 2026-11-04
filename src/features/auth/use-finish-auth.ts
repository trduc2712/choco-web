import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { useRedirectPath } from './use-redirect-path'

type FinishAuthParams = {
  decorateUrl: (url: string) => string
}

export function useFinishAuth() {
  const navigate = useNavigate()
  const redirectPath = useRedirectPath()

  return useCallback(
    ({ decorateUrl }: FinishAuthParams) => {
      const url = decorateUrl(redirectPath)

      if (url.startsWith('http')) {
        window.location.assign(url)
      } else {
        void navigate(url, { replace: true })
      }
    },
    [navigate, redirectPath],
  )
}
