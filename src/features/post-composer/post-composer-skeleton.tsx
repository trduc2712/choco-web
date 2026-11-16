import { Card } from '@/components/card/card'
import { Skeleton } from '@/components/skeleton/skeleton'

import styles from './post-composer.module.scss'

// The collapsed composer's shape, shown while the home page loads.
export function PostComposerSkeleton() {
  return (
    <Card aria-hidden="true">
      <div className={styles.prompt}>
        <Skeleton
          shape="circle"
          width="var(--size-avatar-md)"
          height="var(--size-avatar-md)"
        />
        <Skeleton shape="rect" className={styles.promptSkeleton} />
      </div>
    </Card>
  )
}
