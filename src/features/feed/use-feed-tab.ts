import { useSearchParams } from 'react-router'

export type FeedTab = 'feed' | 'following'

const TAB_PARAM = 'tab'

// The selected feed lives in the URL so the header can switch it while the
// home page reads it.
export function useFeedTab() {
  const [params, setParams] = useSearchParams()
  const tab: FeedTab =
    params.get(TAB_PARAM) === 'following' ? 'following' : 'feed'

  function setTab(next: FeedTab) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current)
        if (next === 'feed') updated.delete(TAB_PARAM)
        else updated.set(TAB_PARAM, next)
        return updated
      },
      { replace: true },
    )
  }

  return { tab, setTab }
}
