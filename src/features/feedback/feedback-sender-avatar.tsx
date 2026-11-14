import { Avatar } from '@/components/avatar/avatar'
import { getAvatarUrl } from '@/lib/avatar-url'

import type { FeedbackAuthor } from './feedback-admin-api'
import { authorName } from './feedback-format'

// The sender's picture; their initials when they have none, and a person when
// the account is deleted.
export function SenderAvatar({
  author,
}: {
  // null when the sender's account is deleted.
  author: FeedbackAuthor | null
}) {
  return author ? (
    <Avatar
      name={authorName(author)}
      src={getAvatarUrl(author.avatarUrl)}
      size="md"
    />
  ) : (
    <Avatar name="?" fallback="person" size="md" />
  )
}
