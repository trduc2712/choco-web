import { useTranslation } from 'react-i18next'

import { Badge, VisuallyHidden } from '@/components'

import type { PropDoc } from './entry-docs'
import styles from './props-table.module.scss'

type PropsTableProps = {
  props: PropDoc[]
}

export function PropsTable({ props }: PropsTableProps) {
  const { t } = useTranslation('designSystem')

  if (props.length === 0) {
    return <p className={styles.empty}>{t('docs.noProps')}</p>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
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
              <th scope="row" className={styles.name}>
                <code>{prop.name}</code>
                {prop.required && (
                  <Badge tone="danger" size="sm">
                    {t('docs.required')}
                  </Badge>
                )}
              </th>
              <td data-label={t('docs.type')}>
                <code className={styles.type}>{prop.type}</code>
                <p className={styles.description}>{prop.description}</p>
              </td>
              <td className={styles.defaultCell} data-label={t('docs.default')}>
                {prop.default ? (
                  <code className={styles.default}>{prop.default}</code>
                ) : (
                  <>
                    <span className={styles.none} aria-hidden="true">
                      —
                    </span>
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
