import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useRefreshCurrentUser } from '@/features/current-user'
import { ApiError } from '@/lib/api-client'
import { apiFieldIssues, translateApiIssue } from '@/lib/api-errors'

type AdminListErrorProps = {
  error: unknown
  onRetry: () => void
}

// Why an admin list did not load. A 403 means the permissions held in memory
// are old (the screen was shown because of one), so they are asked for again.
// A 400 names the query fields the API refused; anything else can be retried.
export function AdminListError({ error, onRetry }: AdminListErrorProps) {
  const { t } = useTranslation()
  const refreshCurrentUser = useRefreshCurrentUser()
  const isForbidden = error instanceof ApiError && error.status === 403

  useEffect(() => {
    if (isForbidden) void refreshCurrentUser()
  }, [isForbidden, refreshCurrentUser])

  if (isForbidden) {
    return (
      <section role="alert">
        <h2>{t('admin.listError.forbidden')}</h2>
        <p>{t('admin.listError.forbiddenHint')}</p>
      </section>
    )
  }

  const issues = apiFieldIssues(error)
  if (issues.length > 0) {
    return (
      <div role="alert">
        <strong>{t('admin.listError.invalidQuery')}</strong>
        <ul>
          {issues.map((issue) => (
            <li key={`${issue.field}:${issue.code ?? issue.message}`}>
              {t(`admin.listError.fields.${issue.field}`, {
                defaultValue: issue.field,
              })}
              : {translateApiIssue(issue, t)}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <section role="alert">
      <h2>{t('admin.listError.generic')}</h2>
      {
        <button type="button" onClick={onRetry}>
          {t('admin.listError.retry')}
        </button>
      }
    </section>
  )
}
