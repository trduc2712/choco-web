import type { IconName } from '@/components/icon/icon-paths'

type MenuItemBase = {
  id: string
  label: string
  icon?: IconName
  isDisabled?: boolean
}

export type MenuActionItem = MenuItemBase & {
  onSelect: () => void
  tone?: 'default' | 'danger'
  shortcut?: string
  isChecked?: boolean
  submenu?: never
  value?: never
}

export type MenuSubmenuItem = MenuItemBase & {
  submenu: MenuActionItem[]
  value?: string
  onSelect?: never
  tone?: never
  shortcut?: never
  isChecked?: never
}

export type MenuItem = MenuActionItem | MenuSubmenuItem

export type MenuSection = {
  id: string
  label?: string
  items: MenuItem[]
}

export type MenuEntry = MenuItem | MenuSection

export type MenuInitialFocus = 'first' | 'last' | 'checked' | 'none'

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
