import { useTranslation } from 'react-i18next'

import styles from './spacing-usage.module.scss'

const NUMBERS = [1, 2, 3]

export function SpacingUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <ul className={styles.list}>
      {NUMBERS.map((number) => (
        <li key={number} className={styles.item}>
          {t('samples.item', { number })}
        </li>
      ))}
    </ul>
  )
}
