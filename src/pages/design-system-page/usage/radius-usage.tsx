import { useTranslation } from 'react-i18next'

import styles from './radius-usage.module.scss'

export function RadiusUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <div>
      <span className={styles.tag}>{t('samples.tag')}</span>
      <p className={styles.panel}>{t('samples.body')}</p>
    </div>
  )
}
