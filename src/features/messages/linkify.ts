export type ContentPart =
  { kind: 'text'; text: string } | { kind: 'link'; text: string; href: string }

// http(s) URLs and bare www. hosts. Anything else (javascript:, data:, ...)
// stays plain text.
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi
// Punctuation that usually ends the sentence, not the URL.
const TRAILING = /[.,;:!?'")\]}]+$/

function count(text: string, character: string) {
  return text.split(character).length - 1
}

function safeHref(raw: string) {
  const href = /^www\./i.test(raw) ? `https://${raw}` : raw
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null
  } catch {
    return null
  }
}

// Splits plain text into text and link parts. The result is rendered as React
// text and anchors, so message content is never parsed as HTML.
export function linkify(content: string): ContentPart[] {
  const parts: ContentPart[] = []
  let last = 0

  for (const match of content.matchAll(URL_PATTERN)) {
    const start = match.index
    const trailing = match[0].match(TRAILING)?.[0] ?? ''
    let text = match[0].slice(0, match[0].length - trailing.length)
    // Keep a closing bracket that belongs to the URL, e.g. a Wikipedia link.
    if (trailing.startsWith(')') && count(text, '(') > count(text, ')')) {
      text += ')'
    }
    const href = safeHref(text)
    if (!href) continue
    if (start > last) {
      parts.push({ kind: 'text', text: content.slice(last, start) })
    }
    parts.push({ kind: 'link', text, href })
    last = start + text.length
  }

  if (last < content.length) {
    parts.push({ kind: 'text', text: content.slice(last) })
  }
  return parts
}
