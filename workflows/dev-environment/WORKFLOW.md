---
id: "002"
name: Dev Environment
status: active
owner: Joseph Gelet
machines: [Windows desktop (DESKTOP-SG2Q00Q), Mac mini (OpenClaw)]
tools: [Cursor, Claude Code, Claude Desktop, Claude.ai, Git Bash, PowerShell, MTT Window Zen, GitHub CLI, Node/pnpm, Supabase CLI, Render, Vercel]
---

# 002 â€” Dev Environment

## Purpose
Keep the machine, the tools, and the AI layer in a known-good state so building (workflow 001) never stalls on environment problems. This workflow owns the map of what is installed and why, the health checks, the maintenance routines, and the backlog of improvements â€” whether or not a tool exists yet for each one.

## Scope
| In | Out |
|---|---|
| Machines, OS, window management, shells, editor, AI layer, local services, credentials hygiene, backups | Product code, sprints, deploys (workflow 001) |

## Stages
| # | Stage | Trigger | Exit | Assets |
|---|---|---|---|---|
| 1 | Inventory | New machine, or "what is actually installed?" | `sysinfo.ps1` output reviewed | `scripts/sysinfo.ps1`, `docs/environment-map.md` |
| 2 | Baseline | Inventory shows drift or gaps | Every item in the checklist passes | `checklists/new-machine.md`, workflow 001's `checklists/environment-setup.md` |
| 3 | Operate | Daily | Work proceeds without environment friction | `docs/window-management.md`, `scripts/repo-status.ps1` |
| 4 | Maintain | Weekly, or after an update | Updates applied, caches clear, config backed up | `docs/maintenance-routine.md`, workflow 001's `docs/cursor-maintenance.md` |
| 5 | Extend | Friction repeats three times | Item added, built, or dropped | `docs/improvement-backlog.md` |

## Rules
- Measure before changing. Run `sysinfo.ps1` and capture output before and after any environment change.
- One change at a time. Environment changes that land together cannot be told apart when something breaks.
- Everything that can be scripted is scripted; scripts are idempotent and back up before writing.
- Config is versioned (`~/.claude`, `.vscode`, settings baselines). The machine is disposable; the config is not.
- Secrets never live in DevOS, in scripts, or in any script output.
- Friction gets logged in the backlog before it gets tooled. Three occurrences, then build.

## Assets
- `docs/environment-map.md` â€” every layer, what fills it, and whether a tool exists
- `docs/improvement-backlog.md` â€” ranked improvements, effort, status, existing tooling
- `docs/window-management.md` â€” MTT Window Zen plus Cursor window and tab conventions
- `docs/maintenance-routine.md` â€” daily, weekly, monthly
- `scripts/sysinfo.ps1` â€” dev-focused system report (OS, hardware, toolchain, AI layer, ports)
- `scripts/repo-status.ps1` â€” branch, dirty files, unpushed commits, last activity across all repos
- `checklists/new-machine.md` â€” bare Windows box to working MTT environment
- `prompts/environment-triage.md` â€” hand an environment problem to Claude Code
- `docs/devos-cli-plan.md` â€” committed build plan for the DevOS CLI (shape B)
- `drafts/` â€” manifesto and homepage copy awaiting merge into the repo's existing docs

## Related
Workflow 001 (`mtt-build-cursor`) owns Claude Code behavior, permissions, prompts, and the session runner. This workflow owns the machine those run on. Where they overlap â€” Cursor maintenance, the settings baseline â€” 001 holds the file and 002 links to it.


## Recommended setup

Claude Desktop + Cursor, which surface owns what, MCP config and setup order: `docs/recommended-setup.md`

## Runtimes

PowerShell 7, Python, Node, winget package updates and cadence: `docs/runtime-updates.md`
