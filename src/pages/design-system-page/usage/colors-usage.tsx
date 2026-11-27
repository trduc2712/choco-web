import { useTranslation } from 'react-i18next'

export function ColorsUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <div>
      <p>{t('samples.body')}</p>
      <p>{t('samples.muted')}</p>
    </div>
  )
}
