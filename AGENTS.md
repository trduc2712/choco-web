# Codex project instructions

Read and follow [CLAUDE.md](CLAUDE.md) before working in this repository. It is
the shared source of truth for architecture, Ares design system constraints,
and the issue/PR workflow. Keep shared project rules there so Claude Code and
Codex follow the same instructions.

## Project context

- React 19, TypeScript, Vite; use npm and Node 22 or newer.
- Routing: `src/router.tsx`; domain logic: `src/features/`; shared UI: Ares in
  `src/components/`; styling: SCSS Modules and semantic tokens.
- Authentication uses Clerk; server state uses TanStack Query; forms use
  React Hook Form and Zod. Translations live in `src/i18n/locales/en/` and
  `src/i18n/locales/ja/`.
- Start development with `npm run dev` (default port 5173). `.claude/launch.json`
  belongs to Claude Code; it is not a Codex launch configuration.
- Repository checks: `npm run lint`, `npm run format:check`, `npm run typecheck`,
  `npm run test`, and `npm run build`.

## Skills shared with Claude Code

Codex skill entry points live in `.agents/skills/`. They reference the original
instructions and resources in `.claude/skills/`; update the originals when
changing a shared workflow. Resolve links inside those originals relative to
their original directory. Use Codex's available tools in place of Claude-only
tool names.

## Working alongside Claude Code

- When both agents implement changes concurrently, use a separate Git worktree
  and branch for each agent. Follow the shared branch naming rules in `CLAUDE.md`.
- Inspect `git status` before editing. Preserve changes made by the user or
  another agent; stage only files belonging to the current task.
- Avoid switching branches, resetting files, or cleaning another agent's worktree.
- If both tasks need the same files, coordinate ownership or integrate one change
  before starting the other. Use different dev-server ports for concurrent runs,
  for example `npm run dev -- --port 5174`.
