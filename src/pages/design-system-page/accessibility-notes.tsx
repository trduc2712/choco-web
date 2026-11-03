import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon, Kbd } from '@/components'

import styles from './accessibility-notes.module.scss'
import type { KeyboardDoc } from './entry-docs'

type AccessibilityNotesProps = {
  notes: string[]
  keyboard?: KeyboardDoc[]
}

export function AccessibilityNotes({
  notes,
  keyboard = [],
}: AccessibilityNotesProps) {
  const { t } = useTranslation('designSystem')

  return (
    <div className={styles.root}>
      <ul className={styles.notes}>
        {notes.map((note) => (
          <li key={note} className={styles.note}>
            <Icon className={styles.icon} name="check-circle" size="sm" />
            {note}
          </li>
        ))}
      </ul>
      {keyboard.length > 0 && (
        <div className={styles.keyboard}>
          <p className={styles.keyboardTitle}>{t('docs.keyboard')}</p>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t('docs.key')}</th>
                  <th scope="col">{t('docs.action')}</th>
                </tr>
              </thead>
              <tbody>
                {keyboard.map(({ keys, description }) => (
                  <tr key={`${keys.join('+')}-${description}`}>
                    <td className={styles.keys}>
                      {keys.map((key, index) => (
                        <Fragment key={key}>
                          {index > 0 && (
                            <span className={styles.or} aria-hidden="true">
                              /
                            </span>
                          )}
                          <Kbd>{key}</Kbd>
                        </Fragment>
                      ))}
                    </td>
                    <td>{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
