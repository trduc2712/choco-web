import { useTranslation } from 'react-i18next'

import { Highlight } from '@/components'

export function HighlightUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <p>
      <Highlight text={t('samples.body')} query={t('samples.highlightQuery')} />
    </p>
  )
}
