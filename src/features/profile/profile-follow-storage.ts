function followStorageKey(viewerId: string, profileId: string) {
  return `choco:profile-follow:v1:${viewerId}:${profileId}`
}

export function readConfirmedFollow(viewerId: string, profileId: string) {
  try {
    return (
      localStorage.getItem(followStorageKey(viewerId, profileId)) === 'true'
    )
  } catch {
    return false
  }
}

export function saveConfirmedFollow(
  viewerId: string,
  profileId: string,
  following: boolean,
) {
  try {
    const key = followStorageKey(viewerId, profileId)
    if (following) localStorage.setItem(key, 'true')
    else localStorage.removeItem(key)
  } catch {
    // The in-memory cache still reflects the confirmed mutation.
  }
}
