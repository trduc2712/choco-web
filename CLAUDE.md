# CLAUDE.md

## Git branches

Always use a dedicated task branch; never commit directly to `main`. Check the
branch before every commit. Name it `<type>/<kebab-description>` (e.g.
`docs/add-codex-instructions`); link it through the `github-issue` skill if applicable.

## Commit messages

Use Conventional Commits. A message starts with `type(scope): summary`, for
example `fix(auth): restore the session`. The scope is optional and uses
lowercase free text naming the area changed.

Allowed types are `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`,
`refactor`, `revert`, `style` and `test`.

Husky checks commit messages locally after `npm ci`. CI checks the commits
introduced by each pull request. Both allow GitHub's merge messages and
standard Git branch merge messages.

## Architecture

`src/` is split into layers, and imports only run downward:

```
router.tsx, layouts/, pages/      routes and screens
        ↓
features/<domain>/                domain logic
        ↓
components/, hooks/, lib/, config/, constants/, i18n/, test/
        ↓
styles/
```

- **Shared layers never import `features/`, `pages/`, `layouts/` or the
  router.** When a shared component needs app content (e.g. the header's
  account menu), it takes it as `children` or a prop and the layout passes it
  in.
- **Features never import `pages/`, `layouts/` or the router.**
- **One feature reaches another only through its public entry**,
  `@/features/<name>` (its `index.ts`). Inside a feature, import its own files
  freely. If two features need the same code, move it to `lib/` or `hooks/`.
- **New domain code goes in `features/<domain>/`:** query hooks, forms, zod
  schemas, types and components that only that domain uses. A page is a thin
  route shell that composes features and shared application components.

ESLint (`no-restricted-imports` in `eslint.config.js`) enforces the first three
rules, so CI fails on a reversed import. Don't silence it; move the code or pass
the content in from above.

## Server state

- Define each feature query's key and fetch function together in a
  `queryOptions` factory. Include every input that identifies the data, such as
  the viewer ID for session-scoped data. Use the factory's `queryKey` for cache
  reads and invalidation.
- Hooks supply session-dependent options such as `enabled`. Use the shared
  QueryClient defaults for freshness and retries. Queries skip retries for HTTP
  4xx errors and retry server and network errors once.

## User interface

Use semantic HTML and native form controls. Keep shared interaction logic in
`src/components/` and global browser styles in `src/styles/main.css`.
