import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'

import { Composer } from './composer'

it('explains a self-block in Vietnamese and disables the composer', async () => {
  const previousLanguage = i18n.language
  await i18n.changeLanguage('vi')
  try {
    const { unmount } = render(
      <Composer
        draftKey="blocked"
        name="Peer"
        closed={{ reason: 'blockedByMe' }}
        onSend={vi.fn()}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Bạn đã chặn người dùng này',
    )
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button')).toBeDisabled()
    unmount()
  } finally {
    await i18n.changeLanguage(previousLanguage)
  }
})
