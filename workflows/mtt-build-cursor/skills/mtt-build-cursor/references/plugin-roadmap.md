# Claude Cursor plugin roadmap (mtt-toolkit / DevOS)

## Architecture facts

- Cursor plugins (`.cursor-plugin/plugin.json`) extend Cursor's own agent only. Claude Code does not load them, even inside Cursor.
- Claude Code shortcuts are a Claude Code plugin: `.claude-plugin/plugin.json`, `skills/<name>/SKILL.md`, `agents/`, `hooks/hooks.json`, `.mcp.json`. Commands are namespaced `/plugin:skill`.
- Zero-install path: a plugin at `%USERPROFILE%\.claude\skills\<name>\` auto-loads as `<name>@skills-dir`.
- Cursor adds the one-key layer via `workbench.action.terminal.sendSequence` keybindings.
- One marketplace repo ships a private `mtt` plugin and a public MIT `maximus` plugin.

## Build list (priority order, ~2-3 days total)

| # | Piece | Effort | Purpose |
|---|---|---|---|
| 1 | Window alerts hook | 1-2h | Windows toast naming the repo when a session waits or finishes |
| 2 | Safety hooks (PreToolUse) | half day | Hard-block prod targets, force-push to main, destructive Supabase/Render/Vercel, printing .env; closes deny-pattern gaps |
| 3 | Settings guard | half day | Startup hook diffs user and repo settings against a master copy; catches silent flips like blockReadsOutsideWorkingDirectories |
| 4 | `mtt` plugin skills | 1 day | sprint-start, spec-intake, pr-merge, migration-verify, deploy-check, flaky <test> |
| 5 | Repo bootstrap | 2-3h | Standard CLAUDE.md, .claude/settings.json, deny rules for new repos |
| 6 | Session handoff notes | 2-3h | Session-end hook writes docs/sessions/ summary for Claude.ai planning |

Hooks are the fiddly part on Windows (PowerShell/Git Bash quoting, payload formats). Skills are fast.

## Maximus skill sort

- Port: wordpress-connect, privsec/find-shareholders, trading pack, devops pack
- Skip: web-research, file-ops (duplicate Claude Code built-ins)
- Rethink: memory-keeper (conflicts with CLAUDE.md and Claude Code memory; session handoff hook likely replaces it)
- maximus-bridge MCP can go in `.mcp.json` to reach the Tycoon OpenClaw agent. It calls the `openclaw` CLI locally, so it must run on the Mac mini and be reachable from Windows or use a remote MCP transport (+half to 1 day).

Rewrite OpenClaw-specific tool references when porting.
