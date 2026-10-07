# Environment map

Every layer of the dev environment, what fills it today, and whether a tool exists or the practice is still manual.

## Machines

| Machine | Role | Notes |
|---|---|---|
| Windows desktop (DESKTOP-SG2Q00Q) | Primary build machine | Cursor, Claude Code, Git Bash, PowerShell, MTT Window Zen |
| Mac mini | OpenClaw host (agent "main", identity "Tycoon") | Reachable for agent work; `maximus-bridge` runs here |

## Layers

| # | Layer | Filled by | Tool exists? |
|---|---|---|---|
| 1 | OS and hardware | Windows 11 | `scripts/sysinfo.ps1` reports state |
| 2 | Window and desktop hygiene | MTT Window Zen | Yes — own product; see `window-management.md` |
| 3 | Editor | Cursor (VS Code fork) | Settings, tasks, keybindings templates in workflow 001 |
| 4 | Shells | Git Bash (primary), PowerShell (Windows-native) | Four-tab convention, workflow 001 `docs/claude-code-tips.md` |
| 5 | Toolchain | Node, pnpm/npm, git, GitHub CLI, Supabase CLI, Vercel CLI, Render | Versions reported by `sysinfo.ps1` |
| 6 | AI layer — implementation | Claude Code in Cursor | Workflow 001 (skill, agents, prompts, session runner) |
| 7 | AI layer — planning | Claude Desktop, Claude.ai | Desktop hosts local MCP servers; browser cannot |
| 8 | AI layer — agents | OpenClaw / Maximus on the Mac mini, `maximus-bridge` MCP | Bridge built; not yet wired into Desktop |
| 9 | Connectors (remote MCP) | Supabase, Render, Vercel, Google Drive, Gmail, Cloudflare | Configured in Claude.ai |
| 10 | Connectors (local MCP) | Filesystem server scoped to `C:\Dev\DevOS` and `~/.claude` | Claude Desktop only |
| 11 | Repos | `C:\Dev\*`, GitHub org MacroTechTitan | `scripts/repo-status.ps1` |
| 12 | Hosting and data | Render, Vercel, Supabase | Deploy digest is still manual — see backlog |
| 13 | Secrets | `.env` files (gitignored), dashboard env vars | Leak prevention still manual — see backlog |
| 14 | Config backup | `~/.claude`, `.vscode`, settings baselines | Partly scripted — see backlog |

## Where config lives

| Path | Holds |
|---|---|
| `%USERPROFILE%\.claude\settings.json` | Claude Code permissions, mode, deny rules |
| `%USERPROFILE%\.claude\skills\`, `agents\`, `hooks\` | Installed skill, subagents, hooks |
| `%APPDATA%\Claude\claude_desktop_config.json` | Claude Desktop local MCP servers |
| `%APPDATA%\Cursor\User\settings.json`, `keybindings.json` | Cursor settings and shortcuts |
| `<repo>\.vscode\` | Per-repo window color, terminal tabs |
| `<repo>\CLAUDE.md`, `<repo>\.claude\` | Per-repo instructions and overrides |
| `~/.bashrc` | `claude` bypass alias, `mtt-run` alias |
| `C:\Dev\DevOS\workflows\` | This system — the source of truth for all of it |

## Flow of a change

1. Something creates friction (a prompt, a manual step, a surprise).
2. It goes in `improvement-backlog.md` with a count.
3. At three occurrences it becomes an asset: a script, a hook, a checklist line, or a documented decision not to build.
4. The asset lands in the owning workflow and is linked from the map above.

## Script encoding

Every `.ps1` file stays ASCII-only and is saved as UTF-8 with BOM. Windows PowerShell 5.1 (`powershell.exe`) reads a BOM-less file as ANSI, so a single em dash corrupts the string literal around it and the whole script fails to parse. pwsh 7 reads UTF-8 by default and hides the problem. Both are installed, and hooks or tools may launch either one. Use `--` in place of an em dash, straight quotes in place of curly ones, and `->` in place of an arrow.
