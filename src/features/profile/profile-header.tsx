import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AspectRatio } from '@/components/aspect-ratio/aspect-ratio'
import { Avatar } from '@/components/avatar/avatar'
import type { ButtonProps } from '@/components/button/button'
import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { useToast } from '@/components/toast/use-toast'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { HOME_PATH } from '@/constants/routes'
import { getAvatarUrl } from '@/lib/avatar-url'

import styles from './profile-header.module.scss'
import { ProfileToolbar } from './profile-toolbar'
import type { useProfileFollow } from './use-profile-follow'

export type PublicProfile = {
  username: string
  displayName: string
  avatarUrl?: string | null
  backgroundImageUrl?: string | null
  followerCount?: number | null
  followingCount?: number | null
  postCount?: number | null
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
  follow,
  countLinks,
}: {
  profile?: PublicProfile
  canEdit?: boolean
  follow?: ReturnType<typeof useProfileFollow>
  countLinks?: { followers: string; following: string }
}) {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [failedBackground, setFailedBackground] = useState<string>()
  const followRef = useRef<HTMLSpanElement>(null)
  const [isFollowOffscreen, setIsFollowOffscreen] = useState(false)
  const hasFollow = follow !== undefined
  const loading = profile === undefined
  const background = profile?.backgroundImageUrl
  const name = profile?.displayName.trim() || profile?.username
  const numberFormat = new Intl.NumberFormat(i18n.resolvedLanguage)
  const metadata = [
    {
      icon: 'users',
      label: t('profile.followers'),
      count: profile?.followerCount,
      to: countLinks?.followers,
    },
    {
      icon: 'user-check',
      label: t('profile.following'),
      count: profile?.followingCount,
      to: countLinks?.following,
    },
    {
      icon: 'file-text',
      label: t('profile.posts'),
      count: profile?.postCount,
      to: undefined,
    },
  ] as const

  // Once the main Follow button scrolls up under the toolbar, offer it there.
  useEffect(() => {
    const target = followRef.current
    if (!target || typeof IntersectionObserver === 'undefined') return
    let scroller = target.parentElement
    while (
      scroller &&
      !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)
    ) {
      scroller = scroller.parentElement
    }
    const bar = scroller?.querySelector<HTMLElement>('[data-profile-toolbar]')
    const observer = new IntersectionObserver(
      ([entry]) =>
        setIsFollowOffscreen(
          !entry.isIntersecting &&
            entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0),
        ),
      {
        root: scroller,
        rootMargin: `-${bar?.offsetHeight ?? 0}px 0px 0px 0px`,
      },
    )
    observer.observe(target)
    return () => {
      observer.disconnect()
      setIsFollowOffscreen(false)
    }
  }, [hasFollow])

  function showMessagingUnavailable() {
    showToast({ tone: 'info', title: t('profile.messagingUnavailable') })
  }

  function toggleFollow() {
    if (!follow) return
    follow.setFollowing(!follow.isFollowing)
  }

  const toolbar = (
    <ProfileToolbar
      to={HOME_PATH}
      backLabel={t('notFound.backToHome')}
      isInert={loading}
      title={
        loading ? <Skeleton className={styles.usernamePlaceholder} /> : name
      }
      action={
        follow && !canEdit && isFollowOffscreen ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              iconStart="message"
              onClick={showMessagingUnavailable}
            >
              {t('profile.message')}
            </Button>
            {follow.isFollowing ? null : (
              <Button
                size="sm"
                variant="primary"
                iconStart="user-circle"
                isLoading={follow.isPending}
                onClick={toggleFollow}
              >
                {t('profile.follow')}
              </Button>
            )}
          </>
        ) : undefined
      }
    />
  )

  const header = (
    <header className={styles.root} aria-hidden={loading || undefined}>
      <AspectRatio ratio={3} className={styles.cover}>
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
              size="sm"
              iconStart="image"
              aria-label={t('profile.chooseWallpaper')}
            >
              <span className={styles.coverLabel}>
                {t('profile.chooseWallpaper')}
              </span>
            </ProfileButton>
          </div>
        ) : null}
      </AspectRatio>
      <div className={styles.details}>
        <div className={styles.avatar}>
          {profile ? (
            <Avatar
              name={name ?? profile.username}
              src={getAvatarUrl(profile.avatarUrl)}
              size="xl"
              shape="square"
              className={styles.portrait}
            />
          ) : (
            <Skeleton shape="rect" className={styles.portrait} />
          )}
        </div>
        <div className={styles.identity}>
          <Heading level={1} size="2xl" className={styles.name}>
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
            {metadata.map(({ icon, label, count, to }) => (
              <div key={icon} className={styles.metadataItem}>
                <dt>
                  <Icon name={icon} size="sm" />
                  {label}
                </dt>{' '}
                <dd>
                  {count == null ? (
                    '—'
                  ) : to ? (
                    <Link
                      to={to}
                      variant="standalone"
                      className={styles.metadataLink}
                      aria-label={`${label}: ${numberFormat.format(count)}`}
                    >
                      {numberFormat.format(count)}
                    </Link>
                  ) : (
                    numberFormat.format(count)
                  )}
                  {loading ? (
                    <Skeleton className={styles.metadataPlaceholder} />
                  ) : null}
                </dd>
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
                <ProfileButton
                  loading={loading}
                  variant="secondary"
                  iconStart="message"
                  onClick={showMessagingUnavailable}
                >
                  {t('profile.message')}
                </ProfileButton>
                {follow ? (
                  <span ref={followRef} className={styles.followSlot}>
                    <Button
                      variant={follow.isFollowing ? 'secondary' : 'primary'}
                      className={
                        follow.isFollowing ? styles.unfollowButton : undefined
                      }
                      iconStart="user-circle"
                      isLoading={follow.isPending}
                      onClick={toggleFollow}
                    >
                      {t(
                        follow.isFollowing
                          ? 'profile.unfollow'
                          : 'profile.follow',
                      )}
                    </Button>
                  </span>
                ) : (
                  <ProfileButton
                    loading={loading}
                    iconStart="user-circle"
                    disabled
                  >
                    {t('profile.follow')}
                  </ProfileButton>
                )}
              </>
            )}
          </div>
          {follow?.isError ? (
            <Text role="alert" size="xs" className={styles.actionNotice}>
              {t('profile.followError')}
            </Text>
          ) : null}
        </div>
      </div>
    </header>
  )

  if (loading) {
    return (
      <div role="status" aria-busy="true" className={styles.loading}>
        <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
        {toolbar}
        {header}
      </div>
    )
  }

  return (
    <>
      {toolbar}
      {header}
      {canEdit ? (
        <Dialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={t('profile.editProfile')}
          className={styles.editDialog}
        />
      ) : null}
    </>
  )
}
