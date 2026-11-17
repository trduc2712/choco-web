import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

import styles from './comments.module.scss'

// Body widths, so the placeholders don't read as one repeated row.
const WIDTHS = [
  'var(--size-measure-md)',
  'var(--size-measure-sm)',
  'var(--space-9)',
]

// Stands in for the comment list while its first page loads. It uses the
// list's own layout and text sizes, so each row is as tall as a one-line
// comment.
export function CommentSkeletons({
  count = 3,
  nested = false,
}: {
  count?: number
  // Inside a thread, where the list has no padding of its own.
  nested?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div role="status">
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
      <ul
        className={nested ? styles.replyList : styles.list}
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className={styles.item}>
            <Skeleton
              shape="circle"
              width="var(--size-avatar-md)"
              height="var(--size-avatar-md)"
            />
            <div className={styles.itemMain}>
              <Text as="div" className={styles.skeletonLine}>
                <Skeleton width="var(--space-9)" />
              </Text>
              <Text as="div" className={styles.skeletonLine}>
                <Skeleton width={WIDTHS[index % WIDTHS.length]} />
              </Text>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
