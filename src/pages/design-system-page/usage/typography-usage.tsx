import { useTranslation } from 'react-i18next'

import styles from './typography-usage.module.scss'

export function TypographyUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <div>
      <p className={styles.title}>{t('samples.heading')}</p>
      <p className={styles.caption}>{t('samples.body')}</p>
      <p className={styles.code}>{t('samples.key')}</p>
    </div>
  )
}
