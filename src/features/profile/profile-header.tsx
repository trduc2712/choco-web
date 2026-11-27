import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AspectRatio } from '@/components/aspect-ratio/aspect-ratio'
import { Avatar } from '@/components/avatar/avatar'
import type { ButtonProps } from '@/components/button/button'
import { Button } from '@/components/button/button'
import { Heading } from '@/components/heading/heading'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { useToast } from '@/components/toast/use-toast'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { getAvatarUrl } from '@/lib/avatar-url'

import { BioEditor } from './bio-editor'
import type { ProfileBlock } from './profile-block-controls'
import { ProfileBlockControls } from './profile-block-controls'
import type { useProfileFollow } from './use-profile-follow'

export type PublicProfile = {
  username: string
  displayName: string
  avatarUrl?: string | null
  bio?: string | null
  backgroundImageUrl?: string | null
  followerCount?: number | null
  followingCount?: number | null
}

function ProfileButton({
  loading,
  ...props
}: ButtonProps & { loading: boolean }) {
  if (!loading) return <Button {...props} />

  return (
    <span>
      <Button {...props} disabled />
      <Skeleton shape="rect" />
    </span>
  )
}

export function ProfileHeader({
  profile,
  canEdit = false,
  isReadOnly = false,
  follow,
  block,
  onMessage,
  children,
}: {
  profile?: PublicProfile
  canEdit?: boolean
  // A suspended viewer reads the profile but changes nothing.
  isReadOnly?: boolean
  follow?: ReturnType<typeof useProfileFollow>
  block?: ProfileBlock
  // Opens the conversation with this person; without it, messaging is off.
  onMessage?: () => void
  // The tabs and posts under the header.
  children?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [failedBackground, setFailedBackground] = useState<string>()
  // Following someone you blocked isn't possible; Unblock takes its place.
  const isBlocked = block?.isBlocked === true
  const loading = profile === undefined
  const background = profile?.backgroundImageUrl
  const name = profile?.displayName.trim() || profile?.username
  const numberFormat = new Intl.NumberFormat(i18n.resolvedLanguage)
  const metadata = [
    {
      label: t('profile.followers'),
      count: profile?.followerCount,
    },
    {
      label: t('profile.following'),
      count: profile?.followingCount,
    },
  ] as const

  function showMessagingUnavailable() {
    showToast({ tone: 'info', title: t('profile.messagingUnavailable') })
  }

  function toggleFollow() {
    if (!follow) return
    follow.setFollowing(!follow.isFollowing)
  }

  const content = (
    <div aria-hidden={loading || undefined}>
      <div>
        <AspectRatio ratio={4.5}>
          {loading ? (
            <Skeleton shape="rect" />
          ) : background && background !== failedBackground ? (
            <img
              src={background}
              alt=""
              onError={() => setFailedBackground(background)}
            />
          ) : null}
          {canEdit ? (
            <div>
              <ProfileButton
                loading={loading}
                variant="secondary"
                iconStart="image"
                aria-label={t('profile.chooseWallpaper')}
                onClick={() =>
                  showToast({
                    tone: 'info',
                    title: t('profile.wallpaperUnavailable'),
                  })
                }
              >
                <span>{t('profile.chooseWallpaper')}</span>
              </ProfileButton>
            </div>
          ) : null}
        </AspectRatio>
        <div>
          <div>
            <div>
              {profile ? (
                <Avatar
                  name={name ?? profile.username}
                  src={getAvatarUrl(profile.avatarUrl)}
                  fallback="person"
                  size="xl"
                  shape="circle"
                />
              ) : (
                <Skeleton shape="rect" />
              )}
            </div>
            <div>
              <Heading level={1}>{loading ? <Skeleton /> : name}</Heading>
              <Text tone="muted">
                {profile ? `@${profile.username}` : <Skeleton />}
              </Text>
            </div>
            {/* The bio and the follow counts run under the name, as on X. */}
            <div>
              {profile?.bio?.trim() ? (
                <Text dir="auto">{profile.bio}</Text>
              ) : null}
              <dl>
                {metadata.map(({ label, count }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{count == null ? '—' : numberFormat.format(count)}</dd>
                    {loading ? <Skeleton /> : null}
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <div>
                {canEdit ? (
                  <ProfileButton
                    loading={loading}
                    variant="secondary"
                    iconStart="edit"
                    onClick={() => setIsEditOpen(true)}
                  >
                    {t('profile.editProfile')}
                  </ProfileButton>
                ) : (
                  <>
                    {isBlocked ? null : follow ? (
                      <Button
                        variant="secondary"
                        className={
                          follow.isFollowing
                            ? 'profile-header-unfollowButton'
                            : undefined
                        }
                        iconStart="user-circle"
                        isLoading={follow.isPending}
                        disabled={isReadOnly}
                        onClick={toggleFollow}
                      >
                        {t(
                          follow.isFollowing
                            ? 'profile.unfollow'
                            : 'profile.follow',
                        )}
                      </Button>
                    ) : (
                      <ProfileButton
                        loading={loading}
                        variant="secondary"
                        iconStart="user-circle"
                        disabled
                      >
                        {t('profile.follow')}
                      </ProfileButton>
                    )}
                    <ProfileButton
                      loading={loading}
                      variant="primary"
                      iconStart="message"
                      onClick={onMessage ?? showMessagingUnavailable}
                    >
                      {t('profile.message')}
                    </ProfileButton>
                    {block && profile ? (
                      <ProfileBlockControls
                        userId={block.userId}
                        name={name ?? profile.username}
                        username={profile.username}
                        block={block}
                        isReadOnly={isReadOnly}
                      />
                    ) : null}
                  </>
                )}
              </div>
              {isBlocked ? (
                <Text size="xs" tone="muted">
                  {t('blocks.notice')}
                </Text>
              ) : follow?.isError ? (
                <Text role="alert" size="xs">
                  {t(
                    follow.isBlockedError
                      ? 'blocks.actionBlocked'
                      : 'profile.followError',
                  )}
                </Text>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  )

  if (loading) {
    return (
      <div role="status" aria-busy="true">
        <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
        {content}
      </div>
    )
  }

  return (
    <>
      {content}
      {canEdit && isEditOpen ? (
        <BioEditor
          bio={profile?.bio}
          isReadOnly={isReadOnly}
          onClose={() => setIsEditOpen(false)}
        />
      ) : null}
    </>
  )
}
