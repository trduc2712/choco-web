# CLAUDE.md

## Git branches

Always use a dedicated task branch; never commit directly to `main`. Check the
branch before every commit. Name it `<type>/<kebab-description>` (e.g.
`docs/add-codex-instructions`); link it through the `github-issue` skill if applicable.

## Commit messages

Use Conventional Commits. A message starts with `type(scope): summary`, for
example `fix(auth): restore the session`. The scope is optional and uses
lowercase free text naming the area changed. Use `ares` for changes to Ares.

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
components/ (Ares), hooks/, lib/, config/, constants/, i18n/, test/
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
  route shell that composes features and Ares components.

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

## Design system: Ares

This project uses **Ares**, an in-house design system built in this repo.
**Only Ares may be used** — no external design systems, UI kits, styling
frameworks or icon packs (e.g. MUI, Ant Design, shadcn/Radix, Bootstrap,
Tailwind, styled-components, lucide). Don't install them, import them or load
them from a CDN.

Where it lives:

- Components: `src/components/`, imported from `@/components`
- Tokens: `src/styles/tokens/`; mixins: `src/styles/_mixins.scss`
- Docs: `/design-system` (`src/pages/design-system-page/`)

Rules:

- Reuse existing Ares components; check `src/components/` before building UI.
- Every visual value uses semantic tokens (`--color-*`, `--space-*`,
  `--radius-*`, `--font-*`, ...). No hard-coded colors, sizes or shadows.
- Use Ares mixins (`focus-ring`, `control`, `up`/`down`, ...) and the `Icon`
  component.
- Style with CSS Modules (`*.module.scss`) and `cx` from `@/lib/cx`.
- Third-party UI that can't be avoided (e.g. Clerk) is themed with Ares tokens.

**Never modify Ares without asking first.** Any change to Ares components,
tokens, mixins or docs needs the user's approval before you make it: explain
what you want to change and why, then wait for a yes.

**Ares changes get their own issue and PR.** Once an Ares change is
approved, open a separate GitHub Issue for it, labelled `area: ares`, and do
the work on its own branch with its own PR that closes that issue. Never bundle
Ares changes into a feature branch or PR; the feature work waits for, or
rebases on, the Ares PR.

**Ares changes use the `ares` scope.** Every commit message and PR title on a
branch that changes Ares uses `ares` as its Conventional Commits scope, e.g.
`feat(ares): add a sharp avatar shape` or `fix(ares): keep focus in the dialog`.

If Ares is missing something, propose extending Ares (a new component,
variant or token, with tests and a docs entry). Don't reach for an outside
library.
