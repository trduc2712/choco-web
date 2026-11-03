export type ColorScheme = 'light' | 'dark'
export type Rgb = readonly [number, number, number]
export type Tokens = ReadonlyMap<string, string>

const DECLARATION = /(--[\w-]+):\s*([^;]+);/g
const LIGHT_DARK = /^light-dark\(\s*(.+?)\s*,\s*(.+?)\s*\)$/
const REFERENCE = /^var\((--[\w-]+)\)$/
const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i

export function parseTokens(...sources: string[]): Tokens {
  const tokens = new Map<string, string>()

  for (const source of sources) {
    for (const [, name, value] of source.matchAll(DECLARATION)) {
      tokens.set(name, value.replace(/\s+/g, ' ').trim())
    }
  }

  return tokens
}

export function resolveColor(
  tokens: Tokens,
  value: string,
  scheme: ColorScheme,
): Rgb | undefined {
  const lightDark = LIGHT_DARK.exec(value)
  if (lightDark) {
    return resolveColor(tokens, lightDark[scheme === 'light' ? 1 : 2], scheme)
  }

  const reference = REFERENCE.exec(value)
  if (reference) {
    const referenced = tokens.get(reference[1])
    return referenced === undefined
      ? undefined
      : resolveColor(tokens, referenced, scheme)
  }

  const hex = HEX.exec(value)
  if (hex) {
    return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)]
  }

  return undefined
}

function channelLuminance(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function relativeLuminance([red, green, blue]: Rgb): number {
  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  )
}

export function contrastRatio(first: Rgb, second: Rgb): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second))
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second))

  return (lighter + 0.05) / (darker + 0.05)
}
