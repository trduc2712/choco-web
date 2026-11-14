import { useTranslation } from 'react-i18next'

import { Spinner } from '@/components/spinner/spinner'

import styles from './page-loading.module.scss'

// The full-page wait shown while a lazy route or the viewer's permissions load.
// It fades in after a short delay, so a fast load never flashes it.
export function PageLoading() {
  const { t } = useTranslation()

  return (
    <div className={styles.root} role="status">
      <Spinner size="lg" tone="primary" isDecorative />
      <p className={styles.label}>{t('common.loading')}</p>
    </div>
  )
}
