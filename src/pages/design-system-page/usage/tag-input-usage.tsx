import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TagInput } from '@/components'

export function TagInputUsage() {
  const { t } = useTranslation('designSystem')
  const [tags, setTags] = useState([t('samples.tagValue', { number: 1 })])

  return (
    <TagInput
      label={t('samples.tagsLabel')}
      placeholder={t('samples.tagsPlaceholder')}
      value={tags}
      onChange={setTags}
    />
  )
}
