import { useTranslation } from 'react-i18next'

export function UserIdentitySkeleton() {
  const { t } = useTranslation()
  return <span role="status">{t('common.loading')}</span>
}

export function UserRowSkeletons({ label }: { label: string }) {
  return <span role="status">{label}</span>
}

export function UserOptionSkeletons() {
  const { t } = useTranslation()
  return <span aria-hidden="true">{t('common.loading')}</span>
}
