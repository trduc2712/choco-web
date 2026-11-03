import { useTranslation } from 'react-i18next'

import styles from './shadows-usage.module.scss'

export function ShadowsUsage() {
  const { t } = useTranslation('designSystem')

  return <p className={styles.popover}>{t('samples.body')}</p>
}
