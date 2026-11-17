import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import { i18n } from '@/i18n/i18n'

import { Composer } from './composer'

it('explains a self-block in Vietnamese in place of the composer', async () => {
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
    expect(screen.getByRole('status')).toHaveTextContent(
      'Bỏ chặn người dùng này để nhắn tin lại.',
    )
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    unmount()
  } finally {
    await i18n.changeLanguage(previousLanguage)
  }
})
