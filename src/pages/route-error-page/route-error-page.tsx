import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { HOME_PATH } from '@/constants/routes'

export function RouteErrorPage() {
  const { t } = useTranslation()

  return (
    <main>
      <section>
        <h1>{t('routeError.title')}</h1>
        <p>{t('routeError.description')}</p>
        {
          <div>
            <button type="button" onClick={() => window.location.reload()}>
              {t('routeError.reload')}
            </button>
            <RouterLink to={HOME_PATH}>{t('notFound.backToHome')}</RouterLink>
          </div>
        }
      </section>
    </main>
  )
}
