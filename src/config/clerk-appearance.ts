import type { ClerkProviderProps } from '@clerk/react'

export const clerkAppearance: ClerkProviderProps['appearance'] = {
  options: { unsafe_disableDevelopmentModeWarnings: true },
}
