import { useTranslation } from 'react-i18next'

export function TypographyUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <div>
      <p>{t('samples.heading')}</p>
      <p>{t('samples.body')}</p>
      <p>{t('samples.key')}</p>
    </div>
  )
}
