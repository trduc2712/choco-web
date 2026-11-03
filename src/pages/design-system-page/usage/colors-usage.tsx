import { useTranslation } from 'react-i18next'

import styles from './colors-usage.module.scss'

export function ColorsUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <div className={styles.notice}>
      <p>{t('samples.body')}</p>
      <p className={styles.meta}>{t('samples.muted')}</p>
    </div>
  )
}
