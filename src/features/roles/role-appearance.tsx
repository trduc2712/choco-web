import { cx } from '@/lib/cx'
import { symbols } from '@/lib/symbols'

import type { Role } from './roles-api'

export function RoleMark({
  role,
  check = false,
}: {
  role: Pick<Role, 'color' | 'icon' | 'isDefault'>
  check?: boolean
}) {
  return (
    <span
      className={cx('roles-roleMark', `roles-${role.color ?? 'gray'}`)}
      aria-hidden="true"
    >
      <span aria-hidden="true">
        {
          symbols[
            check
              ? 'check'
              : (role.icon ?? (role.isDefault ? 'user' : 'shield'))
          ]
        }
      </span>
    </span>
  )
}
