import { useSyncExternalStore } from 'react'

function subscribeToAttention(onChange: () => void) {
  window.addEventListener('focus', onChange)
  window.addEventListener('blur', onChange)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    window.removeEventListener('focus', onChange)
    window.removeEventListener('blur', onChange)
    document.removeEventListener('visibilitychange', onChange)
  }
}

const hasAttention = () =>
  document.visibilityState === 'visible' && document.hasFocus()

// True while the tab is visible and focused: someone can be reading it.
export function usePageAttention() {
  return useSyncExternalStore(subscribeToAttention, hasAttention, () => false)
}

function subscribeToClock(onChange: () => void) {
  const timer = setInterval(onChange, 250)
  return () => clearInterval(timer)
}

const subscribeToNothing = () => () => {}

const currentSecond = () => Math.floor(Date.now() / 1000) * 1000

// The current time to the second, ticking while `isActive` (a countdown is
// showing). While inactive it is 0.
export function useNow(isActive: boolean) {
  return useSyncExternalStore(
    isActive ? subscribeToClock : subscribeToNothing,
    isActive ? currentSecond : () => 0,
    () => 0,
  )
}
