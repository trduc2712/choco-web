import { useTranslation } from 'react-i18next'

export type GoogleButtonProps = {
  isLoading?: boolean
  onClick: () => void
}

export function GoogleButton({ isLoading, onClick }: GoogleButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      aria-busy={isLoading || undefined}
      disabled={isLoading}
      onClick={onClick}
    >
      {t('auth.continueWithGoogle')}
    </button>
  )
}
