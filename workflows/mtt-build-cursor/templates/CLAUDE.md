# CLAUDE.md — [Product]

Methodology: docs/MTTBuild.md

## Commands
- Install: `pnpm install`
- Dev: `pnpm dev` (server tab, not Claude's)
- Test: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Build: `pnpm build`

## Stack
[framework, database, hosting]

## Conventions
- Branches `sprint/N-shortname` from master; spec is Commit 1
- Migrations are written, never auto-applied
- Admin routes use the ADMIN_PATH constant
- Inspection uses literal commands with repo-relative paths

## Never
- Print or commit secrets or `.env` contents
- Mutate production without explicit approval
- Force-push or rewrite history
