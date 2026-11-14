import { Highlight } from '@/components/highlight/highlight'
import { HoverCard } from '@/components/hover-card/hover-card'
import { Link } from '@/components/link/link'
import { AdminUserPreview } from '@/features/users-admin'

import type { FeedbackAuthor } from './feedback-admin-api'
import styles from './feedback-author-link.module.scss'
import { useAuthorPath } from './use-author-path'

// The sender in a row: just their username, linking to them. Hovering or
// focusing it opens a card with what the admin endpoint knows about the user
// (loaded then, not before); only admins who may read users get the card.
export function FeedbackAuthorLink({
  author,
  highlight,
}: {
  author: FeedbackAuthor
  // A phrase to mark in the username, such as the sender search.
  highlight?: string
}) {
  const { canViewUsers, pathOf } = useAuthorPath()
  const link = (
    <Link to={pathOf(author)} variant="subtle" className={styles.link}>
      @
      {highlight ? (
        <Highlight text={author.username} query={highlight} isPhrase />
      ) : (
        author.username
      )}
    </Link>
  )

  return canViewUsers ? (
    <HoverCard trigger={link} placement="bottom-start">
      <AdminUserPreview userId={author.id} />
    </HoverCard>
  ) : (
    link
  )
}
