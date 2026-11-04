# CLAUDE.md

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
