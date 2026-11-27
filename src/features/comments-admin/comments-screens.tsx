import { AllCommentsList } from './all-comments-list'
import { CommentedPostsQueue } from './commented-posts-queue'
import { CommentsToolbar } from './comments-toolbar'
import { useAdminCommentsState } from './use-admin-comments-state'

// The Posts tab: posts with comments and the chosen post's thread.
export function CommentsByPost() {
  const state = useAdminCommentsState()
  return (
    <div>
      <CommentsToolbar state={state} />
      <CommentedPostsQueue state={state} />
    </div>
  )
}

// The All comments tab: one comment per row.
export function AllComments() {
  const state = useAdminCommentsState()
  return (
    <div>
      <CommentsToolbar state={state} />
      <AllCommentsList state={state} />
    </div>
  )
}
