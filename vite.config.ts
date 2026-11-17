import { execSync } from 'node:child_process'
import { basename } from 'node:path'
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

// Linked git worktrees each get their own stable dev-server port (5200-5299,
// derived from the worktree folder name) so parallel sessions don't collide.
// The main checkout keeps Vite's default 5173. `choco-api` accepts any
// localhost port in Development. Override with the PORT environment variable.
function readDevPort(): number | undefined {
  if (process.env.PORT) return Number(process.env.PORT)
  try {
    const git = (flag: string) =>
      execSync(`git rev-parse --path-format=absolute ${flag}`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim()
    if (git('--git-dir') === git('--git-common-dir')) return undefined
  } catch {
    return undefined
  }
  const name = basename(process.cwd())
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 100
  return 5200 + hash
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiBaseUrl = loadEnv(mode, process.cwd()).VITE_API_BASE_URL
  const apiTarget = apiBaseUrl ? parseApiBaseUrl(apiBaseUrl) : undefined

  return {
    server: {
      port: readDevPort(),
      strictPort: readDevPort() !== undefined,
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
