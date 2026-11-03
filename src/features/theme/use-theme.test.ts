import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'

import { THEME_STORAGE_KEY, useTheme } from '@/features/theme/use-theme'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

test('defaults to the system theme', () => {
  const { result } = renderHook(() => useTheme())

  expect(result.current.theme).toBe('system')
  expect(document.documentElement).not.toHaveAttribute('data-theme')
})

test('applies and persists an explicit theme', () => {
  const { result } = renderHook(() => useTheme())

  act(() => result.current.setTheme('dark'))

  expect(result.current.theme).toBe('dark')
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
})

test('clears the override when switching back to the system theme', () => {
  const { result } = renderHook(() => useTheme())

  act(() => result.current.setTheme('light'))
  act(() => result.current.setTheme('system'))

  expect(result.current.theme).toBe('system')
  expect(document.documentElement).not.toHaveAttribute('data-theme')
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
})

test('follows a theme change made in another tab', () => {
  const { result } = renderHook(() => useTheme())

  act(() => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    window.dispatchEvent(
      new StorageEvent('storage', { key: THEME_STORAGE_KEY }),
    )
  })

  expect(result.current.theme).toBe('dark')
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
})
