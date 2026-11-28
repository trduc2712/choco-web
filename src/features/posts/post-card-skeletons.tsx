import { useTranslation } from 'react-i18next'

export function PostCardSkeletons() {
  const { t } = useTranslation()
  return <span role="status">{t('common.loading')}</span>
}

export function PostSkeleton() {
  const { t } = useTranslation()
  return <span role="status">{t('common.loading')}</span>
}
