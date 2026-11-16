import type { CatalogPermission } from './roles-api'

const GROUPS = ['roles', 'content', 'reports', 'feedback', 'users', 'audit-log']
const SENSITIVE = new Set([
  'posts.delete-any',
  'comments.delete-any',
  'users.suspend',
])

export function groupCatalog(catalog: readonly CatalogPermission[]) {
  const groups = new Map<string, CatalogPermission[]>()
  for (const item of catalog) {
    const prefix = item.code.split('.')[0]
    const group =
      item.group ??
      (prefix === 'posts' || prefix === 'comments' ? 'content' : prefix)
    const permissions = groups.get(group) ?? []
    permissions.push({
      ...item,
      group,
      isSensitive:
        item.isSensitive ??
        (SENSITIVE.has(item.code) ||
          (group === 'roles' && item.code !== 'roles.read')),
    })
    groups.set(group, permissions)
  }
  return [...groups].sort(
    ([left], [right]) =>
      ((GROUPS.indexOf(left) + GROUPS.length + 1) % (GROUPS.length + 1)) -
      ((GROUPS.indexOf(right) + GROUPS.length + 1) % (GROUPS.length + 1)),
  )
}

export function groupLabelKey(group: string) {
  return 'admin.roles.groups.' + group
}
