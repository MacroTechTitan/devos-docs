# Runtimes and package updates (Windows)

Keep the toolchain current with winget where possible. ASCII only in this file, like all DevOS scripts and docs on this machine.

## Why PowerShell 7

Windows PowerShell 5.1 reads BOM-less UTF-8 as ANSI, so any script containing a non-ASCII character fails to parse. That broke sysinfo.ps1 and repo-status.ps1. PowerShell 7 reads UTF-8 without a BOM by default and removes the whole class of bug.

Both can coexist. 5.1 stays as `powershell.exe`, 7 installs as `pwsh.exe`. Nothing that depends on 5.1 breaks.

Until every machine has 7, DevOS .ps1 files stay ASCII-only and UTF-8 with BOM.

## Install / update

    winget install --id Microsoft.PowerShell --source winget --accept-source-agreements
    winget install --id Python.Python.3.13 --source winget
    winget install --id OpenJS.NodeJS.LTS --source winget
    winget install --id Git.Git --source winget
    winget install --id GitHub.cli --source winget

Verify:

    pwsh -NoProfile -Command "$PSVersionTable.PSVersion"
    python --version
    node --version
    git --version
    gh --version

## Routine update pass

List what is outdated:

    winget upgrade

Update a single package:

    winget upgrade --id <PackageId>

Update everything (review the list first - this can pull in unrelated apps):

    winget upgrade --all

Not covered by winget:

| Tool | Update via |
|---|---|
| Claude Code | `claude update` with no window running it |
| Cursor | Ctrl+Shift+P > Cursor: Attempt Update |
| Cursor extensions | Ctrl+Shift+X > Outdated > Update All |
| Claude Desktop | in-app updater |
| npm globals | `npm -g outdated` then `npm -g update` |
| pnpm | `pnpm self-update` |
| Supabase CLI | `winget upgrade --id Supabase.CLI` or scoop, depending on install method |

## Cadence

Weekly with the rest of the maintenance routine: run `winget upgrade`, update anything on the list that DevOS depends on, then re-run `devos doctor` (or sysinfo.ps1) and compare versions against last week.

Never update runtimes mid-sprint. A Node or Python bump changes build behavior; do it at a sprint boundary with gates green before and after.

## After any runtime update

1. `devos doctor` (or sysinfo.ps1) - confirm every tool still resolves on PATH
2. Run one repo's full gates: tests, typecheck, lint, build
3. If a gate breaks, the runtime bump is the first suspect - check the version diff before debugging code
