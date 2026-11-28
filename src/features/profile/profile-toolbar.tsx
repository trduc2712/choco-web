import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import { useLocation, useNavigate } from 'react-router'

export function ProfileToolbar({
  to,
  backLabel,
  title,
  isHeading = false,
  isInert = false,
  action,
}: {
  to: string
  backLabel: string
  title: ReactNode
  isHeading?: boolean
  isInert?: boolean
  action?: ReactNode
}) {
  const navigate = useNavigate()
  const { key } = useLocation()

  return (
    <div aria-hidden={isInert || undefined} data-profile-toolbar="">
      <RouterLink
        to={to}
        aria-label={backLabel}
        tabIndex={isInert ? -1 : undefined}
        onClick={(event) => {
          // Go back to the page the viewer came from. `to` is where the link
          // leads when that page isn't known (a page opened directly) and for
          // new-tab clicks.
          if (
            key === 'default' ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return
          }
          event.preventDefault()
          void navigate(-1)
        }}
      >
        <span aria-hidden="true">←</span>
      </RouterLink>
      {isHeading ? <h1>{title}</h1> : <p>{title}</p>}
      {action ? <div>{action}</div> : null}
    </div>
  )
}
