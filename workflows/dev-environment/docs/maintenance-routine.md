# Maintenance routine

## Daily (2 minutes)

    powershell -File C:\Dev\DevOS\workflows\dev-environment\scripts\repo-status.ps1

Look for: dirty repos you forgot, unpushed commits, branches older than a week.

## Weekly (10 minutes)

1. `sysinfo.ps1` — compare against last week's output; note version drift and free-space changes.
2. Update Cursor, extensions, and Claude Code (workflow 001 `docs/cursor-maintenance.md`).
3. Clear Cursor caches if it feels slow or an update stuck.
4. `git worktree prune` and delete merged local branches.
5. Re-run workflow 001 `scripts/setup-all-windows.sh` to catch settings that updates re-enabled.
6. Back up `~/.claude` (backlog #7 until scripted).

## Monthly (30 minutes)

1. Disk: check free space per drive in `sysinfo.ps1`; clear `node_modules` in dormant repos.
2. Review `improvement-backlog.md`: promote anything that hit three occurrences, drop anything that stopped hurting.
3. Verify the environment checklist still passes end to end on a fresh terminal.
4. Confirm remote MCP connectors still authenticate (Supabase, Render, Vercel, Drive, Gmail, Cloudflare).

## After any Claude Code or Cursor update

Run workflow 001's `checklists/environment-setup.md`. Updates can reset the default terminal profile, re-enable the read block, and add new settings keys.
