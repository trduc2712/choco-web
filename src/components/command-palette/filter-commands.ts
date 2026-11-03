import type { IconName } from '@/components/icon/icon-paths'

export type CommandPaletteItem = {
  id: string
  label: string
  description?: string
  icon?: IconName
  group?: string
  keywords?: string[]
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[\s-]+/g, '')
}

function matches(item: CommandPaletteItem, needle: string) {
  return [item.label, item.id, item.group ?? '', ...(item.keywords ?? [])].some(
    (text) => normalize(text).includes(needle),
  )
}

function rank(item: CommandPaletteItem, needle: string) {
  const label = normalize(item.label)

  return label.startsWith(needle) ? 0 : label.includes(needle) ? 1 : 2
}

export function filterCommands(
  items: CommandPaletteItem[],
  query: string,
): CommandPaletteItem[] {
  const needle = normalize(query.trim())

  if (!needle) {
    return items
  }

  return items
    .filter((item) => matches(item, needle))
    .sort((first, second) => rank(first, needle) - rank(second, needle))
}
