import { useTranslation } from 'react-i18next'

import { type RoleTemplate, TEMPLATES } from './role-template-data'

export function RoleTemplates({
  selected,
  onSelect,
}: {
  selected?: RoleTemplate
  onSelect: (template: RoleTemplate) => void
}) {
  const { t } = useTranslation()
  return (
    <div>
      {(Object.keys(TEMPLATES) as RoleTemplate[]).map((key) => (
        <button
          type="button"
          key={key}
          aria-pressed={selected === undefined ? undefined : selected === key}
          onClick={() => onSelect(key)}
        >
          {t(`admin.roles.templates.${key}`)}
        </button>
      ))}
    </div>
  )
}
