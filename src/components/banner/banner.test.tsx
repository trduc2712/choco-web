import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Banner } from '@/components/banner/banner'
import styles from '@/components/banner/banner.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('a banner names itself, shows an action and can be dismissed', async () => {
  const onDismiss = vi.fn()
  const { container } = render(
    <Banner
      tone="warning"
      title="Banner Title"
      action={<button type="button">Action Label</button>}
      onDismiss={onDismiss}
    >
      Banner message
    </Banner>,
  )
  const banner = screen.getByRole('region', { name: 'Banner Title' })

  expectStyle(banner, styles, 'warning')
  expect(banner).toHaveTextContent('Banner message')

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.dismiss') }),
  )

  expect(onDismiss).toHaveBeenCalledTimes(1)
  await expectNoA11yViolations(container)
})
