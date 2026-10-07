# Cursor maintenance (Windows)

## Update everything

| What | How |
|---|---|
| Cursor | Ctrl+Shift+P → **Cursor: Attempt Update**, restart when prompted. If stuck: quit Cursor, clear caches (below), run Cursor as administrator, or reinstall from cursor.com/download |
| Release channel | Cursor Settings → Stable (default) or Early Access |
| Extensions | Ctrl+Shift+X → filter **Outdated** → Update All |
| Claude Code | `claude update` with no other window running it; auto-update fails with `claude.exe in use` |
| This workflow's assets | Re-run `scripts/install-assets.sh` and `tools/session-runner/install-runner.sh` after updating |

Command palette **Clear Editor History** resets cached editor state without touching files.

## Where Cursor keeps data

| Path | Holds | Safe to delete |
|---|---|---|
| `%APPDATA%\Cursor\Cache`, `Code Cache`, `GPUCache`, `CachedData`, `DawnGraphiteCache`, `DawnWebGPUCache` | Rendering and HTTP caches | Yes, with Cursor closed |
| `%APPDATA%\Cursor\logs` | Logs, including update errors | Yes |
| `%APPDATA%\Cursor\User\workspaceStorage` | Per-folder state **and chat history** | No, unless you want chats gone |
| `%APPDATA%\Cursor\User\settings.json`, `keybindings.json`, `globalStorage` | Settings, keybindings, sign-in | No |
| `%USERPROFILE%\.cursor\extensions` | Installed extensions | Only for a clean reinstall |
| `%LOCALAPPDATA%\cursor-updater` | Downloaded update payloads; clearing it fixes stuck updates | Yes |
| `%LOCALAPPDATA%\Programs\cursor` | The application | No — use the installer |

## Clear the safe caches

Closes Cursor, clears render/HTTP caches, logs, and stuck update payloads. Leaves settings, keybindings, extensions, and chat history alone.

    powershell -ExecutionPolicy Bypass -File scripts\clear-cursor-cache.ps1

Claude Code sessions die with Cursor. Relaunch each window with `claude --continue` afterwards.

## Do not use "cursor reset" scripts

Public repos advertising cache resets or rate-limit fixes rewrite machine IDs and registry keys to defeat trial limits. They are not maintenance tools.

## When an update breaks something

1. Note the version: Help → About.
2. Check `%APPDATA%\Cursor\logs` for renderer crash lines.
3. Clear caches and relaunch.
4. Still broken: reinstall the current build from cursor.com/download; settings and extensions survive a reinstall.
5. Re-run the environment checklist — updates can reset settings such as the default terminal profile.
