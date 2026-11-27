import { useTranslation } from 'react-i18next'

import { Divider } from '@/components/divider/divider'
import { Heading } from '@/components/heading/heading'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

const CODE_CELLS = 6

type AuthCardSkeletonProps = {
  layout?: 'form' | 'verification'
  // Inputs in the form, each a label over a field.
  fields?: number
  hasGoogle?: boolean
  hasFooter?: boolean
}

// AuthCard's shape while the session or the page loads: the title, the
// description, then the form's own blocks at their real sizes.
export function AuthCardSkeleton({
  layout = 'form',
  fields = 2,
  hasGoogle = false,
  hasFooter = false,
}: AuthCardSkeletonProps) {
  const { t } = useTranslation()
  const isVerification = layout === 'verification'

  return (
    <main role="status">
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
      <div
        className={cx(
          'auth-card-card',
          isVerification && 'auth-card-verification',
        )}
        aria-hidden="true"
      >
        <Stack gap={isVerification ? 6 : 5}>
          <Stack
            gap={isVerification ? 3 : 2}
            className={isVerification ? 'auth-card-intro' : undefined}
          >
            <Heading level={2} size="xl">
              <Skeleton width="var(--size-measure-sm)" />
            </Heading>
            <Text as="div" size={isVerification ? 'sm' : 'md'}>
              <Skeleton width="var(--size-measure-md)" />
            </Text>
          </Stack>
          {hasGoogle ? (
            <>
              <Skeleton shape="rect" height="var(--size-control-md)" />
              <Divider label={t('auth.or')} />
            </>
          ) : null}
          <Stack gap={4}>
            {isVerification ? (
              <div>
                {Array.from({ length: CODE_CELLS }, (_, index) => (
                  <Skeleton
                    key={index}
                    shape="rect"
                    width="var(--size-pin-cell)"
                    height="var(--size-pin-cell)"
                  />
                ))}
              </div>
            ) : (
              Array.from({ length: fields }, (_, index) => (
                <Stack key={index} gap={2}>
                  <div>
                    <Skeleton width="var(--space-9)" />
                  </div>
                  <Skeleton shape="rect" height="var(--size-control-md)" />
                </Stack>
              ))
            )}
            <Skeleton shape="rect" height="var(--size-control-md)" />
          </Stack>
          {hasFooter ? (
            <Text as="div" size="sm">
              <Skeleton width="var(--size-measure-sm)" />
            </Text>
          ) : null}
        </Stack>
      </div>
    </main>
  )
}
