import { Icon } from '@/components/icon/icon'
import { cx } from '@/lib/cx'

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
      <Icon
        name={
          check ? 'check' : (role.icon ?? (role.isDefault ? 'user' : 'shield'))
        }
        size="sm"
      />
    </span>
  )
}
