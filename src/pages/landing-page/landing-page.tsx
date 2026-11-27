import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { SIGN_IN_PATH, SIGN_UP_PATH } from '@/constants/routes'

export function LandingPage() {
  const { t } = useTranslation()

  return (
    <main>
      <h1>{t('landing.brand')}</h1>
      <p>{t('landing.tagline')}</p>
      <nav>
        <Link to={SIGN_UP_PATH}>{t('landing.signUp')}</Link>{' '}
        <Link to={SIGN_IN_PATH}>{t('landing.signIn')}</Link>
      </nav>
    </main>
  )
}
