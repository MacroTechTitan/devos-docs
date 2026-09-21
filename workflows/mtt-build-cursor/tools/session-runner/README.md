# Session runner (`mtt-run`)

Runs a Claude Code task unattended and survives API errors, dropped connections, rate limits, and crashes.

## What it does

1. Reads your task from a prompt file.
2. Runs `claude -p "<task>" --dangerously-skip-permissions --continue` in the target repo.
3. On failure, waits (5s, 10s, 20s, 40s, 60s) and retries with a recovery preamble that tells Claude to rebuild state from `git status` / `git diff` and continue from the first incomplete step instead of restarting.
4. Logs every attempt to `<repo>/.mtt-run/<timestamp>-<prompt>.log`.
5. Pops a Windows toast on success or on giving up.

## Install

    bash install-runner.sh

Adds a `mtt-run` alias to `~/.bashrc`. Requires `node` and `claude` on PATH.

## Use

    cd /c/Dev/DealMatchAI/repo
    mtt-run docs/tasks/phase-0-import-fixes.md

Options: `--repo <path>`, `--retries <n>` (default 5), `--fresh` (new session instead of `--continue`), `--model <name>`, `--quiet`, `--dry-run`.

Write prompt files with the same rules as `prompts/sprint-kickoff.md`: decisions stated up front, gates required, stop conditions listed. Keep them in `docs/tasks/` in the repo so they're versioned.

Add `.mtt-run/` to the repo's `.gitignore`.

## Limits

- Headless: no interactive TUI. You read the log or the console, and Claude cannot ask you questions mid-run — anything it would have asked, it reports at the end. Write the prompt so the stop conditions are explicit.
- One runner per repo working tree. Two runners on one checkout collide, same as two interactive sessions.
- The retry preamble handles transport failures. A task that fails on its own logic will fail the same way on retry, which is why it gives up after `--retries` and toasts you.

## Interactive sessions

`mtt-run` is for unattended work. For a session you're watching, use the keybindings in `templates/vscode/keybindings.json`:

| Key | Does |
|---|---|
| Ctrl+Alt+C | Relaunch: `claude --continue` in the focused terminal |
| Ctrl+Alt+R | Paste the recovery instruction into the running session |
| Ctrl+Alt+G | Ask for gates: tests, typecheck, lint, build with real output |
