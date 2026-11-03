import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SearchInput } from '@/components'

export function SearchInputUsage() {
  const { t } = useTranslation('designSystem')
  const [query, setQuery] = useState('')

  return (
    <SearchInput
      label={t('samples.searchOrders')}
      placeholder={t('samples.searchPlaceholder')}
      value={query}
      onChange={setQuery}
    />
  )
}
