# Window and desktop management

## MTT Window Zen

Window Zen keeps the desktop clean while many windows are open. It is the layer above the editor: which windows exist, where they sit, and what gets closed or restored. Cursor and Claude Code conventions live below it and handle what's inside a window.

Division of responsibility:

| Concern | Owned by |
|---|---|
| Which windows are open, arrangement, cleanup, restore | MTT Window Zen |
| Which repo a window is for, title-bar color | Cursor `.vscode/settings.json` per repo |
| Terminal tabs inside a window (claude / bash / pwsh / server) | Cursor terminal profiles, optional `tasks.json` |
| Which session needs attention | Claude Code notification hook (backlog #1) |

The gap Window Zen does not cover: a clean desktop still doesn't say which Claude Code session is blocked. Toasts fill that.

## Cursor window conventions

- One Cursor window per repo working tree. One Claude Code session per window.
- Title-bar color per product via `.vscode/settings.json` (template in workflow 001).
- Four terminal tabs per window: `claude`, `bash`, `pwsh`, `server`.
- Parallel work in one repo uses a git worktree, opened as its own window, never a second session on the same checkout.

## Keeping the count down

- Close a window when its sprint merges. An idle Cursor window still holds a Claude Code process, file watchers, and language servers.
- `scripts/repo-status.ps1` tells you which repos are actually mid-work, so the rest can be closed without losing track.
- Claude Code auto-update fails while any `claude.exe` runs, so a periodic all-windows-closed moment is worth having.
