import { expect, test } from 'vitest'

import { highlight, tokenize } from '@/components/code-block/highlight'

function kindsOf(code: string, language: 'tsx' | 'scss' | 'json') {
  return tokenize(code, language)
    .filter(({ kind }) => kind !== 'plain')
    .map(({ kind, text }) => [kind, text])
}

test('marks keywords, strings, components and props in tsx', () => {
  expect(
    kindsOf(
      'import { Button } from \'@/components\'\n<Button size="sm" />',
      'tsx',
    ),
  ).toEqual([
    ['keyword', 'import'],
    ['keyword', 'from'],
    ['string', "'@/components'"],
    ['tag', 'Button'],
    ['attribute', 'size'],
    ['string', '"sm"'],
  ])
})

test('marks properties, custom properties and functions in scss', () => {
  expect(kindsOf('.box {\n  padding: var(--space-4);\n}', 'scss')).toEqual([
    ['attribute', 'padding'],
    ['function', 'var'],
    ['variable', '--space-4'],
  ])
})

test('keeps every character and splits the result into lines', () => {
  const code = "const a = 'x'\n\n// done"
  const lines = highlight(code, 'tsx')

  expect(lines).toHaveLength(3)
  expect(lines.map((line) => line.map(({ text }) => text).join(''))).toEqual(
    code.split('\n'),
  )
})

test('marks keys, strings, numbers and literals in json', () => {
  expect(
    kindsOf(
      '{ "status": "new", "width": 1280, "seen": false, "by": null }',
      'json',
    ),
  ).toEqual([
    ['attribute', '"status"'],
    ['string', '"new"'],
    ['attribute', '"width"'],
    ['number', '1280'],
    ['attribute', '"seen"'],
    ['keyword', 'false'],
    ['attribute', '"by"'],
    ['keyword', 'null'],
  ])
})
