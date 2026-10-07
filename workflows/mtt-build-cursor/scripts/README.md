# Scripts

| Script | Run (Git Bash, from this workflow folder) | Does |
|---|---|---|
| `scripts/clear-cursor-cache.ps1` | PowerShell: `powershell -ExecutionPolicy Bypass -File scripts\clear-cursor-cache.ps1` | Closes Cursor, clears render/HTTP caches, logs, stuck updater payloads |
| `scripts/install-assets.sh` | `bash scripts/install-assets.sh` | Copies agents and the skill into `~/.claude/` |
| `skills/mtt-build-cursor/scripts/apply-settings.js` | `node skills/mtt-build-cursor/scripts/apply-settings.js` | Merges bypass, read block off, and deny list into user settings, with backup |
| `skills/mtt-build-cursor/scripts/setup-all-windows.sh` | `bash skills/mtt-build-cursor/scripts/setup-all-windows.sh` | Adds bypass alias, prints global settings, scans C:\Dev for repo overrides |
| `tools/notifications/notify.ps1` | PowerShell: `powershell -ExecutionPolicy Bypass -File tools\notifications\notify.ps1 -Message "Finished"` | Windows toast naming the repo that needs you; wired to Claude Code's Notification and Stop hooks (see `tools/notifications/README.md`) |
| `tools/handoff/write-handoff.js` | Runs as a Claude Code Stop hook (stdin payload); by hand: `bash tools/handoff/test/run-payload.sh <payload.json> <out-dir>` | Writes a plain-text snapshot of each finished session to `C:\Dev\chat\<repo>.txt` + `latest.txt` for other Claude chats to read (see `docs/session-handoff.md`) |
