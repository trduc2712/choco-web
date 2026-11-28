import { useTranslation } from 'react-i18next'

export function CommentSkeletons() {
  const { t } = useTranslation()
  return <span role="status">{t('common.loading')}</span>
}
