import { AdminUsernameLink } from '@/features/users-admin'

import type { FeedbackAuthor } from './feedback-admin-api'

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
  return (
    <AdminUsernameLink
      userId={author.id}
      username={author.username}
      highlight={highlight}
    />
  )
}
