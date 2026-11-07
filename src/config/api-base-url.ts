export function parseApiBaseUrl(value: string): URL {
  const url = new URL(value)
  url.pathname = url.pathname.replace(/\/+$/, '') || '/api/v1'
  return url
}
