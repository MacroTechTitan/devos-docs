# Improvement backlog

Ranked by friction removed per hour of build. Status: **done**, **next**, **queued**, **theory** (no tool yet, may never need one).

| # | Item | What it removes | Existing tooling | Effort | Status |
|---|---|---|---|---|---|
| 1 | Session notifications | Cycling through six windows to find the one waiting | Claude Code hooks + PowerShell toast (pattern exists in `mtt-run`) | 1-2h | next |
| 2 | Cross-repo status board | Forgetting a branch with uncommitted work across eight products | `scripts/repo-status.ps1` (built) | done | done |
| 3 | System info report | Guessing at versions, RAM, ports, what's installed | `scripts/sysinfo.ps1` (built) | done | done |
| 4 | Secret-leak prevention | A key pasted into a config file reaching GitHub | `gitleaks` pre-commit hook; GitHub push protection | 2h | queued |
| 5 | Local Supabase for migrations | Verifying migrations against a live project | `supabase start` (CLI already installed) | half day/product | queued |
| 6 | Deploy digest | Six dashboard tabs to answer "is everything up?" | Render + Vercel CLIs/APIs, `/health` endpoints | 2-3h | queued |
| 7 | `~/.claude` under version control | Machine rebuild losing settings, skills, agents | Private repo + sync script | 1h | queued |
| 8 | DevOS MCP server | Zip → download → unzip → robocopy for every file | Wraps CLI verbs; see `devos-cli-plan.md` phase 3 | 1 day | queued |
| 9 | `maximus-bridge` in Claude Desktop | Hand-offs to the Tycoon agent going through the Mac mini manually | Bridge exists; needs Desktop config + reachability | half day | theory |
| 10 | Settings guard hook | `blockReadsOutsideWorkingDirectories` flipping silently | Workflow 001 `apply-settings.js` is the manual version | half day | theory |
| 11 | Session handoff notes | Rebuilding context when moving from Claude Code to planning | Session-end hook writing `docs/sessions/` | 2-3h | theory |
| 12 | Port registry | Two products fighting over 3000/5173 | Convention + `sysinfo.ps1` port section | 1h | theory |
| 13 | Repo bootstrap | Setting up CLAUDE.md, `.vscode`, deny rules by hand per repo | Workflow 001 `templates/` are the manual version | 2-3h | theory |
| 14 | Backup of `C:\Dev` | Losing uncommitted work to a disk failure | Everything pushed is safe; uncommitted is not | 1h | theory |

## CLI

Shape B is committed: a local CLI is the contract, and hooks, the MCP server, and any UI consume its verbs. Items 1, 4, 6, 7, 10, 11, 12 and 13 above become verbs rather than standalone scripts. See `devos-cli-plan.md`.

## Rules for this list

- Nothing gets built on the first occurrence of friction. Log it, count it, build at three.
- A "theory" row is a complete idea with no code. That is a valid end state if the friction stays rare.
- When an item ships, move the asset into the owning workflow and link it from `environment-map.md`.
