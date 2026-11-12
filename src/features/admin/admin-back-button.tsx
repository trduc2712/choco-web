import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/button/button'
import { HOME_PATH } from '@/constants/routes'

// Goes back one page. A tab that opened straight on an admin screen has no
// page behind it, so the button leaves for the app instead.
export function AdminBackButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { key } = useLocation()

  return (
    <Button
      className={className}
      variant="ghost"
      icon="arrow-left"
      aria-label={t('admin.back')}
      onClick={() => {
        if (key === 'default') void navigate(HOME_PATH)
        else void navigate(-1)
      }}
    />
  )
}
