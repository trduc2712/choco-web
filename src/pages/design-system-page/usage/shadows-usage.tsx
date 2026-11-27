import { useTranslation } from 'react-i18next'

export function ShadowsUsage() {
  const { t } = useTranslation('designSystem')

  return <p>{t('samples.body')}</p>
}
