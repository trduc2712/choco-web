import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { useToast } from '@/components/toast/use-toast'
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
        <div style={{ aspectRatio: 4.5 }}>
          {loading ? (
            <span aria-hidden="true">&hellip;</span>
          ) : background && background !== failedBackground ? (
            <img
              src={background}
              alt=""
              onError={() => setFailedBackground(background)}
            />
          ) : null}
          {canEdit ? (
            <div>
              <button
                type="button"
                disabled={loading}
                aria-label={t('profile.chooseWallpaper')}
                onClick={() =>
                  showToast({
                    tone: 'info',
                    title: t('profile.wallpaperUnavailable'),
                  })
                }
              >
                <span>{t('profile.chooseWallpaper')}</span>
              </button>
            </div>
          ) : null}
        </div>
        <div>
          <div>
            <div>
              {profile ? (
                <Avatar
                  name={name ?? profile.username}
                  src={getAvatarUrl(profile.avatarUrl)}
                  fallback="person"
                />
              ) : (
                <span aria-hidden="true">&hellip;</span>
              )}
            </div>
            <div>
              {!loading && <h1>{name}</h1>}
              <p>
                {profile ? (
                  `@${profile.username}`
                ) : (
                  <span aria-hidden="true">&hellip;</span>
                )}
              </p>
            </div>
            {/* The bio and the follow counts run under the name, as on X. */}
            <div>
              {profile?.bio?.trim() ? <p dir="auto">{profile.bio}</p> : null}
              <dl>
                {metadata.map(({ label, count }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{count == null ? '—' : numberFormat.format(count)}</dd>
                    {loading ? <span aria-hidden="true">&hellip;</span> : null}
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <div>
                {canEdit ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setIsEditOpen(true)}
                  >
                    {t('profile.editProfile')}
                  </button>
                ) : (
                  <>
                    {isBlocked ? null : follow ? (
                      <button
                        type="button"
                        aria-busy={follow.isPending || undefined}
                        disabled={isReadOnly || follow.isPending}
                        className={
                          follow.isFollowing
                            ? 'profile-header-unfollowButton'
                            : undefined
                        }
                        onClick={toggleFollow}
                      >
                        {t(
                          follow.isFollowing
                            ? 'profile.unfollow'
                            : 'profile.follow',
                        )}
                      </button>
                    ) : (
                      <button type="button" disabled>
                        {t('profile.follow')}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={onMessage ?? showMessagingUnavailable}
                    >
                      {t('profile.message')}
                    </button>
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
                <p>{t('blocks.notice')}</p>
              ) : follow?.isError ? (
                <p role="alert">
                  {t(
                    follow.isBlockedError
                      ? 'blocks.actionBlocked'
                      : 'profile.followError',
                  )}
                </p>
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
        <span className="visually-hidden">{t('common.loading')}</span>
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
