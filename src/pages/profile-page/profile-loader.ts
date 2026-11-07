import type { LoaderFunctionArgs } from 'react-router'

export function profileLoader({ params }: LoaderFunctionArgs) {
  const handle = params.handle ?? ''
  if (!handle.startsWith('@') || handle.length === 1 || handle.length > 65) {
    return { status: 'not-found' as const }
  }

  return { status: 'ready' as const, username: handle.slice(1) }
}
