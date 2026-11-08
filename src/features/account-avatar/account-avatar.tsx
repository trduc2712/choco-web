import type { AvatarProps } from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import { Skeleton } from '@/components/skeleton/skeleton'

import { getAccountAvatarColor } from './account-avatar-color'

type AccountAvatarProps = Omit<AvatarProps, 'fallbackColor'> & {
  accountId?: string
  isAccountIdLoading?: boolean
}

export function AccountAvatar({
  accountId,
  isAccountIdLoading,
  size = 'md',
  shape = 'circle',
  ...props
}: AccountAvatarProps) {
  if (isAccountIdLoading) {
    const dimension = `var(--size-avatar-${size})`
    return (
      <Skeleton
        shape={shape === 'circle' ? 'circle' : 'rect'}
        width={dimension}
        height={dimension}
        className={props.className}
      />
    )
  }

  return (
    <Avatar
      {...props}
      size={size}
      shape={shape}
      fallbackColor={getAccountAvatarColor(accountId)}
    />
  )
}
