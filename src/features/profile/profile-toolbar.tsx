import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'

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
      <Link
        to={to}
        variant="subtle"
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
        <Icon name="arrow-left" />
      </Link>
      {isHeading ? (
        <Heading level={1} size="xl">
          {title}
        </Heading>
      ) : (
        <Text size="xl" weight="semibold" isTruncated>
          {title}
        </Text>
      )}
      {action ? <div>{action}</div> : null}
    </div>
  )
}
