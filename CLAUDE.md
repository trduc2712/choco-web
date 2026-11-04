# CLAUDE.md

## Design system: Temper

This project uses **Temper**, an in-house design system built in this repo.
**Only Temper may be used** — no external design systems, UI kits, styling
frameworks or icon packs (e.g. MUI, Ant Design, shadcn/Radix, Bootstrap,
Tailwind, styled-components, lucide). Don't install them, import them or load
them from a CDN.

Where it lives:

- Components: `src/components/`, imported from `@/components`
- Tokens: `src/styles/tokens/`; mixins: `src/styles/_mixins.scss`
- Docs: `/design-system` (`src/pages/design-system-page/`)

Rules:

- Reuse existing Temper components; check `src/components/` before building UI.
- Every visual value uses semantic tokens (`--color-*`, `--space-*`,
  `--radius-*`, `--font-*`, ...). No hard-coded colors, sizes or shadows.
- Use Temper mixins (`focus-ring`, `control`, `up`/`down`, ...) and the `Icon`
  component.
- Style with CSS Modules (`*.module.scss`) and `cx` from `@/lib/cx`.
- Third-party UI that can't be avoided (e.g. Clerk) is themed with Temper tokens.

**Never modify Temper without asking first.** Any change to Temper components,
tokens, mixins or docs needs the user's approval before you make it: explain
what you want to change and why, then wait for a yes.

**Temper changes get their own issue and PR.** Once a Temper change is
approved, open a separate GitHub Issue for it, labelled `area: temper`, and do
the work on its own branch with its own PR that closes that issue. Never bundle
Temper changes into a feature branch or PR; the feature work waits for, or
rebases on, the Temper PR.

If Temper is missing something, propose extending Temper (a new component,
variant or token, with tests and a docs entry). Don't reach for an outside
library.
