import { useTranslation } from 'react-i18next'

import { SkipLink } from '@/components'

const MAIN_ID = 'skip-link-usage-main'

export function SkipLinkUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <div id={MAIN_ID}>{t('samples.mainContent')}</div>
    </>
  )
}
