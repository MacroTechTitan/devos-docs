# devos

The DevOS CLI. It reports on the local dev environment and runs work in it by
wrapping the scripts under `workflows/`. The scripts are still the source of
truth and still run on their own, so nothing breaks if `devos` does.

Build plan and design rules: [`workflows/dev-environment/docs/devos-cli-plan.md`](../workflows/dev-environment/docs/devos-cli-plan.md).
Phases 0 and 1 are implemented.

## Install

Requires Node 20+ and has no dependencies. From Git Bash:

```bash
npm link --prefix C:/Dev/DevOS/cli
# or, equivalently
npm link C:/Dev/DevOS/cli
```

That puts `devos` on your PATH. It finds the DevOS root from its own location, so
it works from any directory. To uninstall, run `npm rm -g @mtt/devos`.

## Verbs

| Verb | Does | Wraps | Exit 1 when |
|---|---|---|---|
| `devos doctor` | System report plus FLAGS | `workflows/dev-environment/scripts/sysinfo.ps1 -Json` | any flag fires |
| `devos status [--root <dir>] [--depth <n>]` | Repos, branch, dirty, ahead/behind, idle days | `workflows/dev-environment/scripts/repo-status.ps1 -Json` | any repo dirty or unpushed |
| `devos run <prompt-file> [runner options]` | Unattended Claude Code session with retry | `workflows/mtt-build-cursor/tools/session-runner/bin/mtt-run.js` | the runner gave up |
| `devos apply [--only <target>]` | Brings this machine to the workflow baseline | see the apply table below | a write or verification failed |
| `devos sync <workflow>` | Installs a workflow's assets where its docs say they go | the workflow's own scripts and READMEs | a write or verification failed |
| `devos notify <title> <message>` | Desktop toast, as the Claude Code hooks use | `workflows/mtt-build-cursor/tools/notifications/notify.ps1` | — |

Anything that touches PowerShell tries `pwsh` (PowerShell 7) first and falls
back to `powershell.exe` (Windows PowerShell 5.1).

`run` sends everything after `run` to the session runner unchanged, including
`--dry-run` and `--help`. Put devos flags such as `--verbose` before `run`.

`notify` takes the title and message as two arguments. Pass an empty title to
keep notify.ps1's own fallback, which names the repo of the working directory:

```bash
devos notify DevOS "Sprint finished"
devos notify "" "Waiting for input"
```

### Writes: `apply` and `sync`

Both follow the plan's design rules. Without `--yes` they print what would
change and exit 0. With `--yes` they write, after copying any destination whose
content differs to `<file>.bak-<timestamp>`. A file that already matches is left
alone, so a second run is a no-op. Each write is verified by re-hashing the
destination. `--dry-run` wins over `--yes`.

The config directory comes from `USERPROFILE`, then `HOME` — the same
resolution `apply-settings.js` uses — so both stay pointed at one place.

`devos apply` targets, each delegating to the asset that owns it:

| Target | Destination | Owned by |
|---|---|---|
| `settings` | `~/.claude/settings.json` | `skills/mtt-build-cursor/scripts/apply-settings.js` |
| `aliases` | `~/.bashrc` (`claude` bypass, `mtt-run`) | `scripts/setup-all-windows.sh`, `tools/session-runner/install-runner.sh` |
| `agents` | `~/.claude/agents/` | `scripts/install-assets.sh` |
| `skill` | `~/.claude/skills/mtt-build-cursor/` | `scripts/install-assets.sh` |
| `keybindings` | Cursor user keybindings | `templates/README.md` — **manual, not applied** |

`keybindings` is reported and never written. `templates/README.md` documents it
as a hand merge into Cursor's keybindings JSON, and the plan does not say how to
reconcile bindings that are already there, so guessing is not safe.
`devos apply --only keybindings` exits 2 rather than guess.

`devos sync <workflow>` resolves the name to exactly one folder under
`workflows/`; anything with a path separator, a drive letter or `..` is
rejected. Known destinations:

| Workflow | Installs |
|---|---|
| `mtt-build-cursor` | `agents/` → `~/.claude/agents/`, `skills/mtt-build-cursor/` → `~/.claude/skills/`, `tools/notifications/notify.ps1` → `~/.claude/hooks/` |
| `dev-environment` | nothing — its docs and scripts are read and run in place, and no doc gives them an install destination |

Wiring the notification *hooks* into `~/.claude/settings.json` stays manual: see
`tools/notifications/README.md`. The snippet there carries absolute paths for one
username, so `apply` does not merge it.

### Planned, not implemented

These are in the plan's verb contract. Each one currently exits 2 with a
"not implemented" message.

| Verb | Phase |
|---|---|
| `add <workflow> <type> <name>` | 2 |
| `friction "<text>"` | 2 |
| `sessions` | 2 |
| `serve --mcp` | 3 |

## Flags

| Flag | Effect |
|---|---|
| `--help`, `-h` | General help, or verb help with `devos <verb> --help` |
| `--json` | Machine-readable output on stdout; logs and errors go to stderr |
| `--dry-run` | Print the command that would run, then exit 0 without running it |
| `--yes` | Allow writes (`apply`, `sync`). Read-only verbs ignore it |
| `--verbose` | Print the wrapped script and chosen shell to stderr |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | OK |
| 1 | Problems found: a flag fired, a repo needs attention, or a wrapped script failed |
| 2 | Usage error, a planned verb that isn't implemented, or an unsupported platform |

`doctor` and `status` wrap PowerShell and run on Windows only. On any other
platform they exit 2 and say why.

## Layout

```
cli/
  bin/devos.js          dispatcher: flags, verbs, exit codes
  src/commands/         doctor.js, status.js, run.js, apply.js, sync.js, notify.js
  src/lib/paths.js      DevOS root resolved from the CLI's own location
  src/lib/platform.js   Windows gate, pwsh/powershell detection, JSON normalization
  src/lib/home.js       config directory (USERPROFILE, then HOME)
  src/lib/installer.js  compare, back up, copy, verify -- shared by apply and sync
  src/lib/workflows.js  workflow name validation and documented destinations
```
