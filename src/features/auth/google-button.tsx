import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'

export type GoogleButtonProps = {
  isLoading?: boolean
  onClick: () => void
}

export function GoogleButton({ isLoading, onClick }: GoogleButtonProps) {
  const { t } = useTranslation()

  return (
    <Button
      variant="secondary"
      isFullWidth
      isLoading={isLoading}
      onClick={onClick}
    >
      {t('auth.continueWithGoogle')}
    </Button>
  )
}
