import { Text } from '@/components/text/text'
import { userProfilePath } from '@/constants/routes'
import { getAvatarUrl } from '@/lib/avatar-url'

import { AuthorAvatar, AuthorName } from './author-parts'
import type { TopComment } from './posts-api'
import styles from './top-comment-preview.module.scss'

// The comment a feed card shows under its action bar, laid out like a comment
// in the thread (avatar beside the name, the text on the line below). The
// comment button above it opens the full thread.
export function TopCommentPreview({ comment }: { comment: TopComment }) {
  const { author } = comment
  const name = author.displayName.trim() || author.username
  const profilePath = userProfilePath(author.username)

  return (
    <div className={styles.preview}>
      <AuthorAvatar
        name={name}
        src={getAvatarUrl(author.avatarUrl)}
        to={profilePath}
      />
      <div className={styles.main}>
        <AuthorName name={name} to={profilePath} />
        <Text className={styles.text} dir="auto">
          {comment.content}
        </Text>
      </div>
    </div>
  )
}
