import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

// Stands in for the notification list while it loads. The rows use the list's
// own classes and text sizes, so each one is as tall as a one-line
// notification; with `hasTitle` a section title's placeholder leads.
export function NotificationSkeletons({
  count = 5,
  hasTitle = true,
}: {
  count?: number
  hasTitle?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div role="status">
      <VisuallyHidden>{t('notifications.loading')}</VisuallyHidden>
      <div aria-hidden="true">
        {hasTitle ? (
          <div>
            <span>
              <Skeleton width="var(--space-8)" />
            </span>
          </div>
        ) : null}
        <ul>
          {Array.from({ length: count }, (_, index) => (
            <li key={index}>
              <span>
                <Skeleton
                  shape="circle"
                  width="var(--size-avatar-lg)"
                  height="var(--size-avatar-lg)"
                />
                <span>
                  <Text as="span" size="sm">
                    <Skeleton width="var(--size-measure-sm)" />
                  </Text>
                  <Text as="span" size="xs">
                    <Skeleton width="var(--space-7)" />
                  </Text>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
