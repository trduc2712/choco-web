import { useSearchParams } from 'react-router'

import { UserSearchResults } from '@/features/user-search'

export function UserSearchPage() {
  const [params] = useSearchParams()
  return <UserSearchResults query={params.get('q')?.trim() ?? ''} />
}
