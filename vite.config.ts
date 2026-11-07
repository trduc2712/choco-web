import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiBaseUrl = loadEnv(mode, process.cwd()).VITE_API_BASE_URL
  const apiTarget = apiBaseUrl ? new URL(apiBaseUrl) : undefined

  return {
    server: {
      proxy: apiTarget
        ? {
            [apiTarget.pathname.replace(/\/$/, '') || '/api']: {
              target: apiTarget.origin,
              changeOrigin: true,
              secure: !['localhost', '127.0.0.1', '[::1]'].includes(
                apiTarget.hostname,
              ),
            },
          }
        : undefined,
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: true,
      env: {
        VITE_API_BASE_URL: 'http://localhost:3000/api/v1',
        VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_placeholder',
      },
    },
  }
})
