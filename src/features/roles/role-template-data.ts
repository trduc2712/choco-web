import type { Role, RoleColor, RoleIcon } from './roles-api'

export const TEMPLATES = {
  blank: { color: 'gray', icon: 'shield', permissions: [] },
  moderator: {
    color: 'coral',
    icon: 'wrench',
    permissions: [
      'reports.handle',
      'posts.delete-any',
      'comments.delete-any',
      'content.read-any',
      'users.suspend',
      'users.read-any',
    ],
  },
  support: {
    color: 'teal',
    icon: 'eye',
    permissions: [
      'feedback.read-any',
      'feedback.change-status',
      'reports.handle',
      'content.read-any',
      'users.read-any',
    ],
  },
  analyst: {
    color: 'blue',
    icon: 'key',
    permissions: ['audit-log.read', 'content.read-any', 'users.read-any'],
  },
} satisfies Record<
  string,
  { color: RoleColor; icon: RoleIcon; permissions: string[] }
>

export type RoleTemplate = keyof typeof TEMPLATES

export function getTemplate(
  roles: Role[],
  template: RoleTemplate,
  granted: readonly string[],
) {
  const base = TEMPLATES[template]
  const source =
    template === 'moderator'
      ? roles.find((role) => role.systemKey === 'moderator')
      : undefined
  return {
    color: base.color,
    icon: base.icon,
    permissions: (source?.permissions ?? base.permissions).filter((code) =>
      granted.includes(code),
    ),
  }
}
