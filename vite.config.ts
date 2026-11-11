import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

import { parseApiBaseUrl } from './src/config/api-base-url.ts'

// The commit SHA the build comes from; CI exposes it as GITHUB_SHA.
function readAppVersion(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA
  try {
    return execSync('git rev-parse HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiBaseUrl = loadEnv(mode, process.cwd()).VITE_API_BASE_URL
  const apiTarget = apiBaseUrl ? parseApiBaseUrl(apiBaseUrl) : undefined

  return {
    server: {
      proxy: apiTarget
        ? {
            [apiTarget.pathname]: {
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
    define: {
      __APP_VERSION__: JSON.stringify(readAppVersion()),
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-react',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 20,
              },
              {
                name: 'vendor-router',
                test: /[\\/]node_modules[\\/]react-router[\\/]/,
                priority: 10,
              },
              {
                name: 'vendor-clerk',
                test: /[\\/]node_modules[\\/]@clerk[\\/]/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
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
        VITE_API_BASE_URL: 'http://localhost:3000',
        VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_placeholder',
      },
    },
  }
})
