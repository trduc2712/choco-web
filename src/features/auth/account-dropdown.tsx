import { useClerk, useUser } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Popover } from '@/components/popover/popover'
import {
  ADMIN_PATH,
  BLOCKED_USERS_PATH,
  MY_FEEDBACK_PATH,
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
import type { SymbolName } from '@/lib/symbols'
import { symbols } from '@/lib/symbols'

type View = 'root' | 'settings' | 'display' | 'language'

type RowProps = {
  icon?: SymbolName
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
    <button type="button" disabled={isDisabled} onClick={onClick}>
      {icon ? (
        <span>
          <span aria-hidden="true">{symbols[icon]}</span>
        </span>
      ) : null}
      <span>{label}</span>
      {value ? <span>{value}</span> : null}
      {trailing === 'chevron' ? <span aria-hidden="true">›</span> : null}
      {trailing === 'check' ? <span aria-hidden="true">✓</span> : null}
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
        <div>
          <button type="button" disabled={!username} onClick={act(openProfile)}>
            <Avatar name={name} src={avatarUrl} fallback="person" />
            <span>{name}</span>
          </button>
          <hr />
          <button type="button" disabled={!username} onClick={act(openProfile)}>
            {t('auth.accountMenu.viewProfile')}
          </button>
        </div>
        <div>
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
            icon="message"
            label={t('feedback.mine.title')}
            onClick={act(() => void navigate(MY_FEEDBACK_PATH))}
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
        <div>
          <button
            type="button"
            aria-label={t('auth.accountMenu.back')}
            onClick={() => setView(back)}
          >
            {t('auth.accountMenu.back')}
          </button>
          <span>{titles[view]}</span>
        </div>
        <div>{rows}</div>
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
        trigger={
          <button type="button" aria-label={accountLabel}>
            <Avatar name={name} src={avatarUrl} fallback="person" />
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
