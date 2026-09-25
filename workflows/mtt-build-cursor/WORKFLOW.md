---
id: "001"
name: MTT Build — Cursor
status: active
owner: Joseph Gelet
tools: [Claude.ai, Claude Code, Cursor, Git Bash, PowerShell, GitHub CLI, Supabase, Render, Vercel]
methodology: MTTBuild (docs/MTTBuild.md in each repo)
---

# 001 — MTT Build — Cursor

## Purpose
Build and ship MTT products as a solo founder directing Claude Code. Claude.ai is the architect: planning, specs, SQL verification, prompts. Claude Code in Cursor is the implementer: code, gates, git, PRs. Joseph decides and approves.

## Roles
| Role | Owns | Does not |
|---|---|---|
| Joseph | Product decisions, approvals, production, secrets | Watch sessions in real time |
| Claude.ai | Architecture, specs, SQL checks, Claude Code prompts, reviewing reports | Touch repos directly |
| Claude Code | Implementation, gates, git, PRs, reports | Apply migrations or mutate production without approval |

## Stages
| # | Stage | Where | Entry | Exit | Assets |
|---|---|---|---|---|---|
| 0 | Environment | Cursor + Git Bash | New machine or repo, prompts reappearing, Claude Code update | Checklist passes | `checklists/environment-setup.md`, `skills/mtt-build-cursor/`, `templates/` |
| 1 | Plan | Claude.ai | Problem or feature | Decisions made, spec written | `prompts/spec-request.md` |
| 2 | Kickoff | Claude Code | Approved spec | Spec is Commit 1 on `sprint/N-shortname` | `prompts/sprint-kickoff.md` |
| 3 | Build | Claude Code | Spec committed | Phase complete, gates green, committed | `skills/mtt-build-cursor/`, `agents/` |
| 4 | Recover | Claude Code | API error, crash, stale recap | Resumed from git diff | Unattended: `tools/session-runner/` retries automatically. Interactive: `prompts/session-recovery.md`, keybindings, `checklists/window-relaunch.md` |
| 5 | Review | Claude.ai | Claude Code report | Approve, answer, or send fixes | `checklists/pre-merge.md` |
| 6 | Merge + deploy | Claude Code | Approval | Merged, deploy verified by health and logs | `prompts/merge-and-verify.md` |
| 7 | Log + handoff | Claude Code | Merge done | SPRINT_LOG on master, next step stated | `prompts/merge-and-verify.md` |

## Rules that always apply
- Migrations never auto-apply. Production mutations need explicit approval.
- Revert first, not fix forward.
- After any interruption, git diff is authoritative, not the prior narrative.
- Verify with tests, logs, row counts, and health endpoints, not browser DevTools.
- One Claude Code session per working tree.
- All repo and git work goes through Claude Code.

## Setup
`checklists/environment-setup.md`

## Assets
- `docs/claude-code-tips.md` — field guide for Claude Code in Cursor on Windows
- `docs/cursor-maintenance.md` — updates, cache map, safe cache clearing
- `skills/mtt-build-cursor/` — launch, continuous execution, recovery, prompt diagnosis, settings baseline, plugin roadmap
- `agents/repo-explorer.md`, `agents/gate-runner.md` — Claude Code subagents
- `prompts/` — spec request, sprint kickoff, session recovery, merge and verify
- `checklists/` — environment setup, window relaunch, pre-merge
- `tools/session-runner/` — `mtt-run`: unattended Claude Code runs with automatic API-error retry, logging, and toasts
- `tools/handoff/` — Stop hook that writes a readable session snapshot to `C:\Dev\chat\` so any Claude chat can read what Claude Code did
- `scripts/install-assets.sh` — installs agents and skill into `~/.claude/`
- `templates/` — CLAUDE.md starter, per-repo window color, auto-open terminal tabs

## Known issues
- Claude Code extension panel can ignore bypass mode. Use `claude` in the integrated terminal.
- Subagents may prompt under bypass on Windows / Git Bash.
- `blockReadsOutsideWorkingDirectories` can be silently re-enabled. Re-run `setup-all-windows.sh`.
- Auto-update fails while any `claude.exe` is running. Update when windows are idle.
- Cursor updates can reset settings such as the default terminal profile. Re-run the environment checklist after updating (`docs/cursor-maintenance.md`).
