const SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g

/**
 * Matches an accessible name that starts with the given text, such as a
 * required field's label followed by its "required" note.
 */
export function startingWith(text: string): RegExp {
  return new RegExp(`^${text.replace(SPECIAL_CHARACTERS, '\\$&')}`)
}
