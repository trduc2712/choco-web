import { Card } from '@/components/card/card'
import { Skeleton } from '@/components/skeleton/skeleton'

// The collapsed composer's shape, shown while the home page loads.
export function PostComposerSkeleton() {
  return (
    <Card aria-hidden="true">
      <div>
        <Skeleton
          shape="circle"
          width="var(--size-avatar-md)"
          height="var(--size-avatar-md)"
        />
        <Skeleton shape="rect" />
      </div>
    </Card>
  )
}
