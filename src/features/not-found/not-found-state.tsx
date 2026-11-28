import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { HOME_PATH } from '@/constants/routes'

// The "not found" state, centered in the space it is given: the whole screen on
// the catch-all route, the area under the header inside the app. The title and
// description default to the page-not-found wording; a missing thing, such as a
// profile, passes its own.
export function NotFoundState({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div>
      <section>
        <h1>{title ?? t('notFound.title')}</h1>
        <p>{description ?? t('notFound.description')}</p>
        {
          <button type="button" onClick={() => void navigate(HOME_PATH)}>
            {t('notFound.backToHome')}
          </button>
        }
      </section>
    </div>
  )
}
