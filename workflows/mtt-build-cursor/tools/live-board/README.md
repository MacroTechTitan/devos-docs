# Live board

A local, real-time view of Claude Code activity across every session on this
machine. Each tool call, notification and end of turn in any session shows up
on a dark monitor page at **http://127.0.0.1:7777** within milliseconds.

```
log-event.js   hook: one JSON line per event -> C:\Dev\chat\events.jsonl
server.js      127.0.0.1:7777  /  /events (SSE)  /status (devos status + doctor)
board.html     the page: live feed | session cards | repo status table
start-board.cmd  start the server if needed, open the browser
install-hooks.js merge / remove the hook entries in ~/.claude/settings.json
```

Node 20+, zero dependencies.

## Start it

Double-click, or run:

```
C:\Dev\DevOS\workflows\mtt-build-cursor\tools\live-board\start-board.cmd
```

It starts `server.js` in a minimized window titled "DevOS live board" (unless
something is already listening on 7777) and opens the page. Close that window
to stop the server. To run it in the foreground instead:

```
"C:\Program Files\nodejs\node.exe" C:\Dev\DevOS\workflows\mtt-build-cursor\tools\live-board\server.js
```

The hooks log whether or not the server is running. When it starts, the page
backfills the last 500 events.

## The page

- **Header**: event count, connection state (green = live SSE stream), clock.
- **Live feed (left)**: terminal-style, newest at the bottom. Colors by type:
  blue tool, amber edit/write, teal shell, grey read/search, violet
  notification, green stop, red error/interrupted. Scrolling up pauses
  auto-scroll. A "paused - N new" button jumps back to live.
- **Sessions (right top)**: one card per session: repo, branch, last event,
  time since last event, state (working / needs you / turn done). A card goes
  **stale** (dimmed) after 5 minutes without events and drops off after an hour.
- **Repos (right bottom)**: `devos status --json` rows (dirty, ahead, behind,
  days idle, worktrees) and `devos doctor --json` flags. Refreshed every 30s.

## How it differs from the MTT Dev Cockpit

| | Live board (this) | MTT Dev Cockpit |
|---|---|---|
| Where | Local only, `127.0.0.1:7777`, this machine | Hosted claude.ai artifact, any signed-in device |
| Freshness | Real time: each hook event, milliseconds | Hourly scheduled task (and manual updates) |
| Source | Raw hook events + `devos status/doctor` | Curated: priorities, decisions, health, sessions written to its database |
| Answers | "What is every session doing right now?" | "What matters, and what's waiting on me?" |
| Persistence | Rolling `events.jsonl` (5MB + one rotated file) | Artifact database |

Use the board while you're at the desk watching sessions work. Use the Cockpit
for the planning view. Nothing here writes to the Cockpit.

## Event schema

`C:\Dev\chat\events.jsonl`, one JSON object per line:

| Field | Example | Notes |
|---|---|---|
| `ts` | `2026-09-30T01:17:01.919Z` | UTC ISO, when the hook ran |
| `sessionId` | `281e5fed` | first 8 chars of the Claude Code session id (same id8 as `C:\Dev\chat\inbox`) |
| `repo` | `WindowZenOptimizer` | main-worktree folder name, so every worktree of a repo shares it; a generic name like `repo` uses its parent; not a git repo = cwd folder name |
| `branch` | `main` | branch of the worktree the session is in; `(detached abc1234)`; empty outside git |
| `event` | `PostToolUse` | hook event: `PostToolUse`, `Notification`, `Stop` |
| `tool` | `Edit` | tool name (PostToolUse only) |
| `target` | `src/app.ts` | what the tool acted on: path (relative to the worktree), command, pattern, URL, query. Max 120 chars |
| `summary` | `Run tests` | Bash description, notification message, first 120 chars of the final reply on Stop, or `error`/`interrupted` |

Never logged: file contents, edit strings, tool output, prompts. Commands *are*
logged (truncated), so a secret typed on a command line would land here, as it
would in the session handoff.

`events.jsonl` rotates to `events.1.jsonl` (overwriting it) when it passes 5MB.
Both are in `C:\Dev\chat\.gitignore` and the folder README tells Claude chats to
skip them.

## Hooks

Installed user-level in `%USERPROFILE%\.claude\settings.json` for
**PostToolUse, Notification and Stop** (PreToolUse deliberately not wired), each
as its own entry next to the existing hooks:

```json
{
  "hooks": [
    {
      "type": "command",
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\Dev\\DevOs\\workflows\\mtt-build-cursor\\tools\\live-board\\log-event.js"],
      "async": true,
      "timeout": 10
    }
  ]
}
```

`async: true` means Claude Code does not wait for it. The script itself takes
~2-4ms (no child processes; git branch and repo are read straight from `.git`).
Node startup is ~50ms on top, off the session's critical path. Any error exits 0
silently.

Install / reinstall (idempotent, backs up settings.json, merge-only):

```
"C:\Program Files\nodejs\node.exe" C:\Dev\DevOS\workflows\mtt-build-cursor\tools\live-board\install-hooks.js
```

## Disable it

If the hooks ever slow a session, or you just want them off:

```
"C:\Program Files\nodejs\node.exe" C:\Dev\DevOS\workflows\mtt-build-cursor\tools\live-board\install-hooks.js --uninstall
```

That removes only the three `log-event.js` entries and leaves notify.ps1,
write-handoff.js and the inbox hook untouched. It also writes a
`settings.json.bak-live-board-<UTC>` backup first. Claude Code picks up the
change without a restart (`/hooks` shows the current list). To remove them by
hand, delete the three entries whose `args` end in `live-board\log-event.js`.

Stopping the server does not stop logging; only removing the hooks does.

## Test

```
bash C:/Dev/DevOS/workflows/mtt-build-cursor/tools/live-board/test/run-fixtures.sh C:/Dev/DevOS/.scratch/live-board
bash C:/Dev/DevOS/workflows/mtt-build-cursor/tools/live-board/test/check-tail.sh C:/Dev/DevOS/.scratch/live-board 7778
node C:/Dev/DevOS/workflows/mtt-build-cursor/tools/live-board/test/sse-probe.js 60
```

- `run-fixtures.sh`: runs `log-event.js` on the saved payloads in `test/*.json`
  into a scratch file. Checks one line per payload, no leaked bodies, exit 0 on
  garbage, rotation at 5MB, and per-run timing.
- `check-tail.sh`: runs a scratch server on another port. Checks that appends,
  a torn (half-written) line and rotation all come through the SSE stream.
- `sse-probe.js`: attaches to a running board and prints each live event with
  its delivery latency.

## Environment

| Variable | Default | Used by |
|---|---|---|
| `LIVE_BOARD_EVENTS` | `C:\Dev\chat\events.jsonl` | log-event.js, server.js |
| `LIVE_BOARD_PORT` | `7777` | server.js, start-board.cmd |
| `LIVE_BOARD_DEBUG` | unset | log-event.js prints its run time to stderr |
| `DEVOS_JS` | `%APPDATA%\npm\node_modules\@mtt\devos\bin\devos.js` | server.js (falls back to `devos` on PATH) |
| `CLAUDE_SETTINGS` | `%USERPROFILE%\.claude\settings.json` | install-hooks.js |

## Security

The server binds `127.0.0.1` only and rejects requests whose `Host` header is
not `127.0.0.1:<port>` or `localhost:<port>`, so other machines and
DNS-rebinding pages can't read the feed. There is no auth. Anything running
as you on this machine can read it, the same as `events.jsonl` itself.
