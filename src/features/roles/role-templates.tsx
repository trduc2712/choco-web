import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'

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
        <Button
          key={key}
          size="sm"
          variant={selected === key ? 'secondary' : 'ghost'}
          iconStart={key === 'blank' ? 'plus' : TEMPLATES[key].icon}
          aria-pressed={selected === undefined ? undefined : selected === key}
          onClick={() => onSelect(key)}
        >
          {t(`admin.roles.templates.${key}`)}
        </Button>
      ))}
    </div>
  )
}
