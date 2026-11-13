import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AspectRatio } from '@/components/aspect-ratio/aspect-ratio'
import { Avatar } from '@/components/avatar/avatar'
import type { ButtonProps } from '@/components/button/button'
import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { Heading } from '@/components/heading/heading'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { useToast } from '@/components/toast/use-toast'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { getAvatarUrl } from '@/lib/avatar-url'

import { BioEditor } from './bio-editor'
import type { ProfileBlock } from './profile-block-controls'
import { ProfileBlockControls } from './profile-block-controls'
import styles from './profile-header.module.scss'
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
    <span className={styles.buttonPlaceholder}>
      <Button {...props} disabled />
      <Skeleton shape="rect" className={styles.placeholderFill} />
    </span>
  )
}

export function ProfileHeader({
  profile,
  canEdit = false,
  isReadOnly = false,
  follow,
  block,
  children,
}: {
  profile?: PublicProfile
  canEdit?: boolean
  // A suspended viewer reads the profile but changes nothing.
  isReadOnly?: boolean
  follow?: ReturnType<typeof useProfileFollow>
  block?: ProfileBlock
  children?: (intro: ReactNode) => ReactNode
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

  const intro = profile?.bio?.trim() ? (
    <Card as="section" className={styles.intro}>
      <Heading level={2} size="md">
        {t('profile.intro')}
      </Heading>
      <Text size="sm" className={styles.bio}>
        {profile.bio}
      </Text>
    </Card>
  ) : null

  const content = (
    <div className={styles.root} aria-hidden={loading || undefined}>
      <AspectRatio ratio={4.5} className={styles.cover}>
        {loading ? (
          <Skeleton shape="rect" className={styles.coverPlaceholder} />
        ) : background && background !== failedBackground ? (
          <img
            className={styles.coverImage}
            src={background}
            alt=""
            onError={() => setFailedBackground(background)}
          />
        ) : null}
        {canEdit ? (
          <div className={styles.coverAction}>
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
              <span className={styles.coverLabel}>
                {t('profile.chooseWallpaper')}
              </span>
            </ProfileButton>
          </div>
        ) : null}
      </AspectRatio>
      <div className={styles.hero}>
        <div className={styles.details}>
          <div className={styles.avatar}>
            {profile ? (
              <Avatar
                name={name ?? profile.username}
                src={getAvatarUrl(profile.avatarUrl)}
                fallback="person"
                size="xl"
                shape="circle"
                className={styles.portrait}
              />
            ) : (
              <Skeleton shape="rect" className={styles.portrait} />
            )}
          </div>
          <div className={styles.identity}>
            <Heading level={1} className={styles.name}>
              {loading ? <Skeleton className={styles.namePlaceholder} /> : name}
            </Heading>
            <Text tone="muted" className={styles.username}>
              {profile ? (
                `@${profile.username}`
              ) : (
                <Skeleton className={styles.usernamePlaceholder} />
              )}
            </Text>
            <dl className={styles.metadata}>
              {metadata.map(({ label, count }) => (
                <div key={label} className={styles.metadataItem}>
                  <dt>{label}</dt>
                  <dd>{count == null ? '—' : numberFormat.format(count)}</dd>
                  {loading ? (
                    <Skeleton className={styles.metadataPlaceholder} />
                  ) : null}
                </div>
              ))}
            </dl>
          </div>
          <div className={styles.actionGroup}>
            <div className={styles.actions}>
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
                        follow.isFollowing ? styles.unfollowButton : undefined
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
                    onClick={showMessagingUnavailable}
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
              <Text size="xs" tone="muted" className={styles.actionNotice}>
                {t('blocks.notice')}
              </Text>
            ) : follow?.isError ? (
              <Text role="alert" size="xs" className={styles.actionNotice}>
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
      {children ? children(intro) : intro}
    </div>
  )

  if (loading) {
    return (
      <div role="status" aria-busy="true" className={styles.loading}>
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
