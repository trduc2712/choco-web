export type TextPart = { text: string; isMatch: boolean }

// A letter as it is compared: no accent, no case. "Đ" becomes "d" too, because
// it has no accent to take off. Most letters stay one character; a few grow
// (the German sharp s), so the result is a string.
function fold(character: string): string {
  return character
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
}

// What to look for in a query, folded. By default each word is looked for on
// its own; as a phrase, the whole query is one piece to find, spaces inside it
// kept as typed.
export function getTerms(query: string, isPhrase = false): string[] {
  if (isPhrase) {
    const phrase = fold(query.trim())
    return phrase ? [phrase] : []
  }

  return [
    ...new Set(
      fold(query)
        .split(/\s+/)
        .filter((term) => term.length > 0),
    ),
  ]
}

// Cuts `text` into the parts that match a word of `query` and the parts that
// do not. Matching ignores case and accents, and the parts are slices of the
// original text, so "Ảnh đại diện" cut by "anh" gives "Ảnh" as a match.
export function splitByMatches(
  text: string,
  query: string,
  isPhrase = false,
): TextPart[] {
  const terms = getTerms(query, isPhrase)
  if (terms.length === 0) return [{ text, isMatch: false }]

  // The folded text, and for each of its characters where it came from.
  let folded = ''
  const starts: number[] = []
  const ends: number[] = []
  let index = 0
  for (const character of text) {
    const next = fold(character)
    for (let i = 0; i < next.length; i += 1) {
      starts.push(index)
      ends.push(index + character.length)
    }
    folded += next
    index += character.length
  }

  const ranges: [number, number][] = []
  for (const term of terms) {
    let from = folded.indexOf(term)
    while (from !== -1) {
      ranges.push([starts[from], ends[from + term.length - 1]])
      from = folded.indexOf(term, from + term.length)
    }
  }
  if (ranges.length === 0) return [{ text, isMatch: false }]

  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([range[0], range[1]])
  }

  const parts: TextPart[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > cursor) {
      parts.push({ text: text.slice(cursor, start), isMatch: false })
    }
    parts.push({ text: text.slice(start, end), isMatch: true })
    cursor = end
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), isMatch: false })
  }
  return parts
}
