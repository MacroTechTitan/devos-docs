# Notifications

Windows toast notifications for Claude Code, so you can tell which window wants
you when several sessions are open.

- Title = the repo folder name of the session's working directory
- Body = `Waiting for input` or `Finished`

## Files

| File | Purpose |
|---|---|
| `notify.ps1` | Shows the toast. Copy to `~/.claude/hooks/notify.ps1` |
| `hooks.settings.json` | The `hooks` block to merge into `~/.claude/settings.json` |

## Install

1. Copy the script:

   ```
   copy notify.ps1 C:\Users\<you>\.claude\hooks\notify.ps1
   ```

2. Merge the `hooks` key from `hooks.settings.json` into
   `C:\Users\<you>\.claude\settings.json`. Back the file up first, merge the
   `hooks` key only, and re-parse the result to confirm it is still valid JSON.
   If your username is not `macro`, fix the two `-File` paths in the snippet.

3. Restart Claude Code.

## How it works

`notify.ps1` uses a `System.Windows.Forms.NotifyIcon` balloon — part of the .NET
Framework that ships with Windows, so there is no module to install and nothing
to keep updated.

Hook events deliver a JSON payload on stdin. The script reads `cwd` from it and
walks up to the nearest `.git`, so a session started in a subfolder still shows
the repo name rather than the subfolder. If that lookup fails it falls back to
`CLAUDE_PROJECT_DIR`, then to the process working directory.

Two events are wired:

| Event | Matcher | Body | Fires when |
|---|---|---|---|
| `Notification` | `permission_prompt\|idle_prompt` | `Waiting for input` | A tool needs permission, or the session goes idle waiting on you |
| `Stop` | (none) | `Finished` | Claude finishes responding |

Both handlers set `async: true`. The balloon only lives as long as its tray
icon, so the script sleeps a few seconds before disposing it; running async
keeps that delay from holding up the permission prompt or the end of the turn.

The script always exits 0 and swallows its own errors. A missed notification
should never break a session.

## Parameters

```
notify.ps1 [-Title <string>] [-Message <string>] [-DurationSeconds <int>]
```

`-Title` defaults to the derived repo name. `-DurationSeconds` defaults to 6.

## Troubleshooting

Set `CLAUDE_NOTIFY_DEBUG=1` to print the resolved title and message to stderr,
and `CLAUDE_NOTIFY_DRYRUN=1` to resolve them without showing a toast:

```
set CLAUDE_NOTIFY_DEBUG=1
powershell -NoProfile -ExecutionPolicy Bypass -File notify.ps1 -Message "Finished"
```

If nothing appears, the usual causes are Focus Assist / Do Not Disturb, toasts
disabled for the machine (`HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\PushNotifications\ToastEnabled`
set to `0`), or `explorer.exe` not running — the balloon needs it to host the
tray icon.

## Related

`../session-runner/bin/mtt-run.js` uses the same NotifyIcon approach for its own
end-of-run toasts.
