import { useEffect, useState } from 'react'

/** Browser Back can restore the page with its pre-redirect loading state. */
export function useSsoRedirectState() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    function reset() {
      setIsRedirecting(false)
    }

    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  return [isRedirecting, setIsRedirecting] as const
}
