// Public entry of the feedback feature: other layers import from here.
export type {
  FeedbackAuthor,
  FeedbackItem,
  FeedbackListParams,
  FeedbackStatus,
} from './feedback-admin-api'
export {
  FEEDBACK_STATUSES,
  getFeedback,
  listFeedback,
  updateFeedbackStatus,
} from './feedback-admin-api'
export { FeedbackDialog } from './feedback-dialog'
