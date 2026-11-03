import { Skeleton, Stack } from '@/components'

export function SkeletonUsage() {
  return (
    <Stack direction="row" gap={3} align="center">
      <Skeleton shape="circle" width="2.5rem" height="2.5rem" />
      <Skeleton lines={2} width="12rem" />
    </Stack>
  )
}
