import { Avatar } from '@/components/avatar/avatar'
import { getAvatarUrl } from '@/lib/avatar-url'

import type { FeedbackAuthor } from './feedback-admin-api'
import { authorName } from './feedback-format'

// The sender's picture; a person when they have none or the account is
// deleted.
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
      fallback="person"
    />
  ) : (
    <Avatar name="?" fallback="person" />
  )
}
