# Templates

| File | Copy to | Notes |
|---|---|---|
| `CLAUDE.md` | repo root | Fill in commands and stack |
| `vscode/settings.json` | repo `.vscode/settings.json` | One title-bar color per product; merge if the file exists |
| `vscode/keybindings.json` | Cursor user keybindings (Ctrl+Shift+P → Open Keyboard Shortcuts (JSON)) | Ctrl+Alt+C relaunch, Ctrl+Alt+R recover, Ctrl+Alt+G gates; merge with existing entries |
| `vscode/tasks.json` | repo `.vscode/tasks.json` | Opens claude, bash, pwsh tabs on folder open. Needs Cursor user setting `"task.allowAutomaticTasks": "on"`. Test once per machine; if a tab misbehaves, delete that task. Server tab stays manual. |
