import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigationType } from 'react-router'

import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

export function PageNavigation() {
  const { pathname, state } = useLocation()
  const navigationType = useNavigationType()
  const skipHeadingFocus =
    navigationType !== 'POP' && state?.skipHeadingFocus === true
  const { t } = useTranslation()
  const regionRef = useRef<HTMLSpanElement>(null)
  const previousPage = useRef<string | null>(null)

  useEffect(() => {
    const region = regionRef.current
    const app = region?.parentElement
    if (!region || !app) return

    let currentTitle: string | undefined

    const updatePage = () => {
      const heading = app.querySelector<HTMLHeadingElement>('main h1')
      const page = heading?.textContent?.trim()
      if (!heading || !page || page === currentTitle) return
      currentTitle = page

      const title = t('pageNavigation.title', { page })
      if (document.title !== title) document.title = title

      const previous = previousPage.current
      previousPage.current = pathname
      if (previous === null || previous === pathname) return

      if (!skipHeadingFocus) {
        if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      }
      region.replaceChildren(t('pageNavigation.announcement', { page }))
    }

    updatePage()
    // Some screens render their main heading after auth or data loading.
    const observer = new MutationObserver(updatePage)
    observer.observe(app, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [pathname, skipHeadingFocus, t])

  return (
    <VisuallyHidden ref={regionRef} aria-live="polite" aria-atomic="true" />
  )
}
