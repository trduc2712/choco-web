import type { IconName } from '@/components/icon/icon-paths'

export type MenuItem = {
  id: string
  label: string
  onSelect: () => void
  icon?: IconName
  tone?: 'default' | 'danger'
  shortcut?: string
  isDisabled?: boolean
  isChecked?: boolean
}

export type MenuSection = {
  id: string
  label?: string
  items: MenuItem[]
}

export type MenuEntry = MenuItem | MenuSection

export type MenuInitialFocus = 'first' | 'last' | 'checked'

function isSection(entry: MenuEntry): entry is MenuSection {
  return 'items' in entry
}

export function toSections(entries: MenuEntry[]): MenuSection[] {
  const sections: MenuSection[] = []

  for (const entry of entries) {
    if (isSection(entry)) {
      sections.push(entry)
    } else if (sections.at(-1)?.id.startsWith('__loose')) {
      sections.at(-1)?.items.push(entry)
    } else {
      sections.push({ id: `__loose-${sections.length}`, items: [entry] })
    }
  }

  return sections
}
