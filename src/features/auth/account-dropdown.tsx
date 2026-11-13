import { useClerk, useUser } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Popover } from '@/components/popover/popover'
import { Text } from '@/components/text/text'
import {
  ADMIN_PATH,
  BLOCKED_USERS_PATH,
  DESIGN_SYSTEM_PATH,
  SIGN_IN_PATH,
  userProfilePath,
} from '@/constants/routes'
import { ADMIN_PERMISSIONS } from '@/features/admin'
import {
  useMyAvatarUrl,
  usePermissions,
  useSuspension,
} from '@/features/current-user'
import { FeedbackDialog } from '@/features/feedback'
import { useLanguageSubmenuItem } from '@/features/language'
import { useThemeSubmenuItem } from '@/features/theme'

import styles from './account-dropdown.module.scss'

type View = 'root' | 'settings' | 'display' | 'language'

type RowProps = {
  icon?: IconName
  label: string
  // What the row shows after its label: a chevron for a row that opens
  // another view, a check for the chosen option.
  trailing?: 'chevron' | 'check'
  value?: string
  onClick: () => void
  isDisabled?: boolean
}

function Row({ icon, label, trailing, value, onClick, isDisabled }: RowProps) {
  return (
    <button
      type="button"
      className={styles.row}
      disabled={isDisabled}
      onClick={onClick}
    >
      {icon ? (
        <span className={styles.rowIcon}>
          <Icon name={icon} />
        </span>
      ) : null}
      <span className={styles.rowLabel}>{label}</span>
      {value ? (
        <Text as="span" size="sm" tone="muted">
          {value}
        </Text>
      ) : null}
      {trailing === 'chevron' ? (
        <Icon name="chevron-right" className={styles.rowTrailing} />
      ) : null}
      {trailing === 'check' ? (
        <Icon name="check" className={styles.rowCheck} />
      ) : null}
    </button>
  )
}

// The account dropdown, laid out like Facebook's: the profile on top, a short
// list of choices, and the rest one level in (Settings and privacy, Display).
export function AccountDropdown() {
  const { t } = useTranslation()
  const { user } = useUser()
  const { redirectToUserProfile, signOut } = useClerk()
  const navigate = useNavigate()
  const { canAny } = usePermissions()
  const { isSuspended } = useSuspension()
  const avatarUrl = useMyAvatarUrl()
  const theme = useThemeSubmenuItem()
  const language = useLanguageSubmenuItem()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>('root')
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  if (!user) return null

  const username = user.username
  const accountLabel = t('auth.accountMenu.label')
  const name = user.fullName?.trim() || username || accountLabel

  function close() {
    setIsOpen(false)
    setView('root')
  }

  // Runs an action and leaves the dropdown.
  function act(action: () => void) {
    return () => {
      close()
      action()
    }
  }

  function openProfile() {
    if (username) void navigate(userProfilePath(username))
  }

  const titles: Record<Exclude<View, 'root'>, string> = {
    settings: t('auth.accountMenu.settings'),
    display: t('auth.accountMenu.display'),
    language: language.label,
  }

  let content
  if (view === 'root') {
    content = (
      <>
        <div className={styles.profileCard}>
          <button
            type="button"
            className={styles.profile}
            disabled={!username}
            onClick={act(openProfile)}
          >
            <Avatar name={name} src={avatarUrl} size="md" />
            <Text as="span" weight="semibold" className={styles.profileName}>
              {name}
            </Text>
          </button>
          <hr className={styles.divider} />
          <Button
            variant="ghost"
            className={styles.viewProfile}
            isFullWidth
            iconStart="user-circle"
            disabled={!username}
            onClick={act(openProfile)}
          >
            {t('auth.accountMenu.viewProfile')}
          </Button>
        </div>
        <div className={styles.list}>
          <Row
            icon="settings"
            label={t('auth.accountMenu.settings')}
            trailing="chevron"
            onClick={() => setView('settings')}
          />
          <Row
            icon={theme.icon}
            label={t('auth.accountMenu.display')}
            trailing="chevron"
            onClick={() => setView('display')}
          />
          <Row
            icon="message"
            label={t('feedback.menuItem')}
            isDisabled={isSuspended}
            onClick={act(() => setIsFeedbackOpen(true))}
          />
          {canAny(ADMIN_PERMISSIONS) ? (
            <Row
              icon="shield"
              label={t('admin.menuItem')}
              onClick={act(() => void navigate(ADMIN_PATH))}
            />
          ) : null}
          <Row
            icon="log-out"
            label={t('auth.accountMenu.signOut')}
            onClick={act(() => void signOut({ redirectUrl: SIGN_IN_PATH }))}
          />
        </div>
        {import.meta.env.DEV ? (
          <button
            type="button"
            className={styles.devLink}
            onClick={act(() => void navigate(DESIGN_SYSTEM_PATH))}
          >
            {t('auth.accountMenu.designSystem')}
          </button>
        ) : null}
      </>
    )
  } else {
    const back = view === 'language' ? 'settings' : 'root'
    let rows
    if (view === 'settings') {
      rows = (
        <>
          <Row
            icon="languages"
            label={language.label}
            value={language.value}
            trailing="chevron"
            onClick={() => setView('language')}
          />
          <Row
            icon="user-x"
            label={t('blocks.title')}
            onClick={act(() => void navigate(BLOCKED_USERS_PATH))}
          />
          <Row
            icon="user-circle"
            label={t('auth.accountMenu.manageAccount')}
            onClick={act(() => void redirectToUserProfile())}
          />
        </>
      )
    } else {
      const options = view === 'display' ? theme.submenu : language.submenu
      rows = options.map((option) => (
        <Row
          key={option.id}
          icon={option.icon}
          label={option.label}
          trailing={option.isChecked ? 'check' : undefined}
          onClick={option.onSelect}
        />
      ))
    }

    content = (
      <>
        <div className={styles.viewHeader}>
          <Button
            icon="arrow-left"
            variant="ghost"
            size="sm"
            aria-label={t('auth.accountMenu.back')}
            onClick={() => setView(back)}
          />
          <Text as="span" weight="semibold" className={styles.viewTitle}>
            {titles[view]}
          </Text>
        </div>
        <div className={styles.list}>{rows}</div>
      </>
    )
  }

  return (
    <>
      <Popover
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) setView('root')
        }}
        label={accountLabel}
        placement="bottom-end"
        className={styles.panel}
        trigger={
          <button
            type="button"
            className={styles.trigger}
            aria-label={accountLabel}
          >
            <Avatar name={name} src={avatarUrl} size="md" />
          </button>
        }
      >
        {content}
      </Popover>
      <FeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  )
}
