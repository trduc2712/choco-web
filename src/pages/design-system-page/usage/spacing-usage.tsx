import { useTranslation } from 'react-i18next'

const NUMBERS = [1, 2, 3]

export function SpacingUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <ul>
      {NUMBERS.map((number) => (
        <li key={number}>{t('samples.item', { number })}</li>
      ))}
    </ul>
  )
}
