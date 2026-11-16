import { MyFeedbackSkeletons } from '@/features/feedback'

// The page's own shape while the session or the page loads.
export function MyFeedbackPageFallback() {
  return (
    <section>
      <MyFeedbackSkeletons />
    </section>
  )
}
