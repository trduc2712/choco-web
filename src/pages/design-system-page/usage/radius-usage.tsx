import { useTranslation } from 'react-i18next'

export function RadiusUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <div>
      <span>{t('samples.tag')}</span>
      <p>{t('samples.body')}</p>
    </div>
  )
}
