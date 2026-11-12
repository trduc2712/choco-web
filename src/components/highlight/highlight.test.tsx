import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { splitByMatches } from '@/components/highlight/find-matches'
import { Highlight } from '@/components/highlight/highlight'

function matches(text: string, query: string, isPhrase = false) {
  return splitByMatches(text, query, isPhrase)
    .filter((part) => part.isMatch)
    .map((part) => part.text)
}

test('marks every place a word occurs, whatever the case', () => {
  expect(matches('Login fails. I cannot LOGIN.', 'login')).toEqual([
    'Login',
    'LOGIN',
  ])
})

test('ignores accents, in the text and in the query', () => {
  expect(matches('Ảnh đại diện không đổi', 'anh')).toEqual(['Ảnh'])
  expect(matches('Ảnh đại diện không đổi', 'đai')).toEqual(['đại'])
  expect(matches('Trung Đức Đỗ', 'do')).toEqual(['Đỗ'])
  expect(matches('Anh Do', 'ảnh')).toEqual(['Anh'])
})

test('needs no match for every word, and marks each word it finds', () => {
  expect(matches('export fails on profile', 'export profile nothing')).toEqual([
    'export',
    'profile',
  ])
})

test('joins marks that touch or overlap', () => {
  expect(matches('abcdef', 'abc cde')).toEqual(['abcde'])
})

test('returns the text whole when there is nothing to mark', () => {
  expect(splitByMatches('plain text', '   ')).toEqual([
    { text: 'plain text', isMatch: false },
  ])
  expect(splitByMatches('plain text', 'zzz')).toEqual([
    { text: 'plain text', isMatch: false },
  ])
})

test('renders the matches as mark elements', () => {
  render(
    <p data-testid="line">
      <Highlight text="Fix the export button" query="export" />
    </p>,
  )

  expect(screen.getByText('export').tagName).toBe('MARK')
  expect(screen.getByTestId('line')).toHaveTextContent('Fix the export button')
})

test('can look for the whole query as one phrase', () => {
  expect(matches('Ada Lovelace and Ada King', 'ada lovelace', true)).toEqual([
    'Ada Lovelace',
  ])
  expect(matches('Ada Lovelace and Ada King', 'ada lovelace')).toEqual([
    'Ada',
    'Lovelace',
    'Ada',
  ])
})
