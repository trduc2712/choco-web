import { readdirSync } from 'node:fs'

import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Imports run one way: pages/layouts/router → features → shared layers.
// See "Architecture" in CLAUDE.md.
const SHARED_LAYERS = [
  'components',
  'hooks',
  'lib',
  'config',
  'constants',
  'i18n',
  'styles',
  'test',
]

const importsFrom = (layers) => `^(@/|(\\.\\./)+)(${layers.join('|')})(/|$)`

const NO_APP_IMPORTS = {
  regex: importsFrom(['features', 'pages', 'layouts', 'router']),
  message:
    'Shared layers (Ares, hooks, lib, ...) must not import features, pages, layouts or the router. Pass the content in from above instead.',
}

const NO_ROUTE_IMPORTS = {
  regex: importsFrom(['pages', 'layouts', 'router']),
  message: 'Features must not import pages, layouts or the router.',
}

const featureNames = readdirSync(new URL('./src/features', import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const featureBoundaries = featureNames.map((name) => ({
  files: [`src/features/${name}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          NO_ROUTE_IMPORTS,
          {
            regex: `^@/features/(?!${name}/)[^/]+/`,
            message:
              "Import another feature through its public entry, '@/features/<name>' (its index.ts), or move the shared code to lib/.",
          },
        ],
      },
    ],
  },
}))

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      pluginQuery.configs['flat/recommended'],
    ],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: SHARED_LAYERS.map((layer) => `src/${layer}/**/*.{ts,tsx}`),
    rules: {
      'no-restricted-imports': ['error', { patterns: [NO_APP_IMPORTS] }],
    },
  },
  ...featureBoundaries,
  {
    files: ['src/components/index.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  prettier,
])
