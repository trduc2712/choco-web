export type CodeLanguage = 'tsx' | 'scss'

export type TokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'tag'
  | 'attribute'
  | 'function'
  | 'number'
  | 'variable'

export type CodeToken = {
  kind: TokenKind
  text: string
}

type Rule = [kind: TokenKind, pattern: RegExp]

const COMMENT: Rule = ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//]
const STRING: Rule = [
  'string',
  /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/,
]
const NUMBER: Rule = ['number', /\b\d+(?:\.\d+)?(?:rem|px|em|ms|s|%)?/]

const RULES: Record<CodeLanguage, Rule[]> = {
  tsx: [
    COMMENT,
    STRING,
    [
      'keyword',
      /\b(?:import|from|export|default|function|const|let|return|if|else|true|false|null|undefined|type|as|async|await|new|typeof)\b/,
    ],
    ['tag', /(?<=<\/?)[A-Za-z][\w.]*/],
    ['attribute', /\b[\w-]+(?==)/],
    ['function', /\b[A-Za-z_$][\w$]*(?=\()/],
    NUMBER,
  ],
  scss: [
    COMMENT,
    STRING,
    ['keyword', /@[\w-]+/],
    ['variable', /--[\w-]+|\$[\w-]+/],
    ['attribute', /[\w-]+(?=\s*:(?!:))/],
    ['function', /\b[\w-]+(?=\()/],
    NUMBER,
  ],
}

const PATTERNS: Record<CodeLanguage, RegExp> = {
  tsx: combine(RULES.tsx),
  scss: combine(RULES.scss),
}

function combine(rules: Rule[]): RegExp {
  return new RegExp(
    rules.map(([, pattern]) => `(${pattern.source})`).join('|'),
    'g',
  )
}

export function tokenize(code: string, language: CodeLanguage): CodeToken[] {
  const rules = RULES[language]
  const tokens: CodeToken[] = []
  let cursor = 0

  for (const match of code.matchAll(PATTERNS[language])) {
    const index = match.index
    if (index > cursor) {
      tokens.push({ kind: 'plain', text: code.slice(cursor, index) })
    }

    const group = match.slice(1).findIndex((value) => value !== undefined)
    tokens.push({ kind: rules[group][0], text: match[0] })
    cursor = index + match[0].length
  }

  if (cursor < code.length) {
    tokens.push({ kind: 'plain', text: code.slice(cursor) })
  }

  return tokens
}

export function highlight(code: string, language: CodeLanguage): CodeToken[][] {
  const lines: CodeToken[][] = [[]]

  for (const token of tokenize(code, language)) {
    token.text.split('\n').forEach((text, index) => {
      if (index > 0) {
        lines.push([])
      }

      if (text) {
        lines[lines.length - 1].push({ kind: token.kind, text })
      }
    })
  }

  return lines
}
