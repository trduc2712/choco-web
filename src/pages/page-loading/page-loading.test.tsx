import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { i18n } from '@/i18n/i18n'

import { PageLoading } from './page-loading'

test('announces one loading status with a visible label', () => {
  render(<PageLoading />)

  expect(screen.getAllByRole('status')).toHaveLength(1)
  expect(screen.getByRole('status')).toHaveTextContent(i18n.t('common.loading'))
})
