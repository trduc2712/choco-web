import { useNotificationsRealtime } from './use-notifications-realtime'

// Renders nothing; it only holds the real-time connection open.
export function NotificationsRealtime() {
  useNotificationsRealtime()
  return null
}
