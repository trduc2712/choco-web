import { useState } from 'react'

function read(key: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(key)
    return stored === null ? fallback : stored === 'true'
  } catch {
    return fallback
  }
}

// A boolean the browser remembers between visits. Without storage (private
// window, blocked site data) it still works for the life of the page.
export function useStoredBoolean(
  key: string,
  fallback: boolean,
): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => read(key, fallback))

  function update(next: boolean) {
    setValue(next)
    try {
      localStorage.setItem(key, String(next))
    } catch {
      // The choice just isn't remembered.
    }
  }

  return [value, update]
}
