import { useTranslation } from 'react-i18next'

import { Badge, VisuallyHidden } from '@/components'

import type { PropDoc } from './entry-docs'

type PropsTableProps = {
  props: PropDoc[]
}

export function PropsTable({ props }: PropsTableProps) {
  const { t } = useTranslation('designSystem')

  if (props.length === 0) {
    return <p>{t('docs.noProps')}</p>
  }

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th scope="col">{t('docs.prop')}</th>
            <th scope="col">{t('docs.type')}</th>
            <th scope="col">{t('docs.default')}</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name}>
              <th scope="row">
                <code>{prop.name}</code>
                {prop.required && (
                  <Badge tone="danger" size="sm">
                    {t('docs.required')}
                  </Badge>
                )}
              </th>
              <td data-label={t('docs.type')}>
                <code>{prop.type}</code>
                <p>{prop.description}</p>
              </td>
              <td data-label={t('docs.default')}>
                {prop.default ? (
                  <code>{prop.default}</code>
                ) : (
                  <>
                    <span aria-hidden="true">—</span>
                    <VisuallyHidden>{t('docs.noDefault')}</VisuallyHidden>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
