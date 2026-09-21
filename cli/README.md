# devos

The DevOS CLI. It reports on the local dev environment and runs work in it by
wrapping the scripts under `workflows/`. The scripts are still the source of
truth and still run on their own, so nothing breaks if `devos` does.

Build plan and design rules: [`workflows/dev-environment/docs/devos-cli-plan.md`](../workflows/dev-environment/docs/devos-cli-plan.md).
This is Phase 0.

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

`doctor` and `status` try `pwsh` (PowerShell 7) first and fall back to
`powershell.exe` (Windows PowerShell 5.1). Both are read-only.

`run` sends everything after `run` to the session runner unchanged, including
`--dry-run` and `--help`. Put devos flags such as `--verbose` before `run`.

### Planned, not implemented

These are in the plan's verb contract. Each one currently exits 2 with a
"not implemented" message.

| Verb | Phase |
|---|---|
| `apply` | 1 |
| `sync <workflow>` | 1 |
| `notify <title> <msg>` | 1 |
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
| `--yes` | Allow writes. No Phase 0 verb writes, so it is accepted and ignored |
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
  src/commands/         doctor.js, status.js, run.js
  src/lib/paths.js      DevOS root resolved from the CLI's own location
  src/lib/platform.js   Windows gate, pwsh/powershell detection, JSON normalization
```
