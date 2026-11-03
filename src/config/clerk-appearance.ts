import type { ClerkProviderProps } from '@clerk/react'

export const clerkAppearance: ClerkProviderProps['appearance'] = {
  options: { unsafe_disableDevelopmentModeWarnings: true },
  variables: {
    colorPrimary: 'var(--color-primary)',
    colorPrimaryForeground: 'var(--color-text-on-primary)',
    colorDanger: 'var(--color-danger-text)',
    colorSuccess: 'var(--color-success-text)',
    colorWarning: 'var(--color-warning-text)',
    colorNeutral: 'var(--color-text)',
    colorForeground: 'var(--color-text)',
    colorMutedForeground: 'var(--color-text-muted)',
    colorBackground: 'var(--color-surface)',
    colorInput: 'var(--color-bg)',
    colorInputForeground: 'var(--color-text)',
    colorBorder: 'var(--color-border-strong)',
    colorRing: 'var(--color-focus-ring)',
    colorModalBackdrop: 'var(--color-overlay)',
    fontFamily: 'var(--font-sans)',
    borderRadius: 'var(--radius-md)',
  },
}
