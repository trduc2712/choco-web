export function getHintId(id: string): string {
  return `${id}-hint`
}

export function getErrorId(id: string): string {
  return `${id}-error`
}

export function getDescribedBy(
  id: string,
  hint?: string,
  error?: string,
): string | undefined {
  const ids = [hint && getHintId(id), error && getErrorId(id)].filter(Boolean)

  return ids.length > 0 ? ids.join(' ') : undefined
}
