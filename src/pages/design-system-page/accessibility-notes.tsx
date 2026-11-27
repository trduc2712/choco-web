import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon, Kbd } from '@/components'

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
    <div>
      <ul>
        {notes.map((note) => (
          <li key={note}>
            <Icon name="check-circle" size="sm" />
            {note}
          </li>
        ))}
      </ul>
      {keyboard.length > 0 && (
        <div>
          <p>{t('docs.keyboard')}</p>
          <div>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('docs.key')}</th>
                  <th scope="col">{t('docs.action')}</th>
                </tr>
              </thead>
              <tbody>
                {keyboard.map(({ keys, description }) => (
                  <tr key={`${keys.join('+')}-${description}`}>
                    <td>
                      {keys.map((key, index) => (
                        <Fragment key={key}>
                          {index > 0 && <span aria-hidden="true">/</span>}
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
