# MTT Claude Code + Cursor settings baseline (Windows)

## User settings: %USERPROFILE%\.claude\settings.json

Required values:

- `permissions.defaultMode`: `"bypassPermissions"` (fallback: `"auto"`)
- `permissions.blockReadsOutsideWorkingDirectories`: `false`
- `skipDangerousModePermissionPrompt`: `true`

Why the read block matters: Claude Code offers to enable it the first time a read leaves the working directory in auto mode, and saves the answer to user settings. When `true` it applies in every mode, including bypass, and prompts on any command whose paths it cannot resolve statically (`cd x && grep`, loops, pipes, command substitution).

Precedence: repo `.claude/settings.local.json` > repo `.claude/settings.json` > user settings. Check all three.

Always merge, never overwrite. Back up first. Validate JSON after writing. Settings load at launch; relaunch windows.

## Deny list (holds under bypass)

```json
[
  "Bash(git push --force *)", "Bash(git push -f *)", "Bash(rm -rf /*)",
  "Bash(gh repo delete *)", "Bash(supabase projects delete *)",
  "Bash(git push --force*)", "Bash(git push -f*)", "Bash(git push * +*)",
  "Bash(git reset --hard *)", "Bash(git clean -f*)", "Bash(rm -rf *)",
  "Bash(rmdir /s*)", "Bash(gh api -X DELETE *)", "Bash(supabase db reset *)",
  "Bash(vercel remove *)", "Bash(vercel env rm *)", "Bash(docker system prune *)",
  "Bash(dropdb *)", "Bash(psql * -c DROP*)", "Bash(curl * -T *)",
  "Bash(curl * --upload-file *)", "PowerShell(Remove-Item *)",
  "PowerShell(git push --force*)", "PowerShell(git push -f*)"
]
```

Caveats:

- Deny rules are text patterns; rewording (`git -C . push --force`) evades them. A PreToolUse safety hook is the real guard.
- `Bash(rm -rf *)` also blocks routine cleanup such as `rm -rf node_modules`.
- `PowerShell(...)` rules require a Claude Code version with a PowerShell tool. If startup warns about unknown rules, remove them.

## Cursor settings (Preferences: Open User Settings (JSON))

```json
{
  "claudeCode.allowDangerouslySkipPermissions": true,
  "claudeCode.initialPermissionMode": "bypassPermissions"
}
```

Known bug: the extension panel can ignore bypass and keep prompting. The CLI in Cursor's integrated terminal respects settings.

## Cursor keybindings (keybindings.json)

Send a Claude Code command to the focused terminal:

```json
{ "key": "ctrl+alt+s", "command": "workbench.action.terminal.sendSequence", "args": { "text": "/mtt:sprint-start\u000D" }, "when": "terminalFocus" }
```
