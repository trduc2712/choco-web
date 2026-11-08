import type { ReactNode } from 'react'

import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'

import styles from './profile-toolbar.module.scss'

export function ProfileToolbar({
  to,
  backLabel,
  title,
  isHeading = false,
  isInert = false,
}: {
  to: string
  backLabel: string
  title: ReactNode
  isHeading?: boolean
  isInert?: boolean
}) {
  return (
    <div className={styles.root}>
      <Link
        to={to}
        variant="subtle"
        aria-label={backLabel}
        tabIndex={isInert ? -1 : undefined}
        className={styles.backLink}
      >
        <Icon name="arrow-left" />
      </Link>
      {isHeading ? (
        <Heading level={1} size="lg" className={styles.title}>
          {title}
        </Heading>
      ) : (
        <Text size="lg" weight="semibold" className={styles.title} isTruncated>
          {title}
        </Text>
      )}
    </div>
  )
}
