# DevOS CLI — build plan (shape B, committed)

**Decision:** DevOS is content plus a local CLI. The CLI is the contract; hooks, the MCP server, and any UI (Window Zen panel, tray) are consumers of it, never reimplementations. Rejected: content-only (no state, no automation) and a standalone Windows app first (installer, signing, updates before any value).

## Design rules

1. **Read-only by default.** Anything that writes requires `--yes`; without it the command prints the diff and exits 0.
2. **Back up before every write.** `<file>.bak-<timestamp>` next to the original.
3. **Idempotent.** Running any verb twice changes nothing the second time.
4. **Machine-readable.** Every verb supports `--json`. Exit codes: 0 ok, 1 problems found, 2 usage or unsupported.
5. **No dependencies.** Node 20 built-ins only. No network calls in the CLI itself.
6. **Never load-bearing.** The underlying scripts stay directly runnable. If `devos` breaks, nothing is blocked.
7. **Cross-machine.** Node, so the Mac mini gets the same verbs; platform-specific work sits behind `platform.js`.
8. **The CLI never edits workflow content.** It installs, reports, and runs. Authoring stays manual or goes through `add`/`sync`.

## Verbs

| Verb | Does | Writes | Phase |
|---|---|---|---|
| `doctor` | sysinfo + flags; exit 1 if any flag fires | no | 0 |
| `status` | repos, branches, dirty, ahead/behind, idle days; exit 1 if attention needed | no | 0 |
| `run <task.md>` | session runner with retry, logging, toasts | logs only | 0 |
| `apply` | settings baseline, aliases, agents, skill, keybindings — diff then `--yes` | yes | 1 |
| `sync <workflow>` | copy workflow assets to destinations, verify each landed | yes | 1 |
| `notify <title> <msg>` | toast; called by hooks | no | 1 |
| `add <workflow> <type> <name>` | create an asset in the right folder with correct frontmatter | yes | 2 |
| `friction "<text>"` | append to the backlog with an occurrence count | yes | 2 |
| `sessions` | running Claude Code sessions: repo, state, age | no | 2 |
| `serve --mcp` | expose verbs as an MCP server for Claude Desktop | via verbs | 3 |

## Phases

**Phase 0 — skeleton over what exists (done when `devos doctor` replaces a path-typed script call)**
- `package.json`, `bin/devos.js` dispatcher, `--help`, `--json`, `--dry-run`, `--yes`, exit codes
- `doctor`, `status`, `run` wrapping the existing PowerShell and Node scripts
- `src/lib/paths.js` (DevOS root resolution from CLI location), `src/lib/platform.js`
- `npm link` install; works from any cwd
- Acceptance: all three verbs run from three different directories; `--json` parses; non-Windows exits 2 with a clear message

**Phase 1 — installs and notifications (done when a fresh machine is set up by one command)**
- `apply` subsumes `apply-settings.js`, `setup-all-windows.sh`, `install-assets.sh`, `install-runner.sh`, keybindings merge
- `sync` replaces zip → unzip → robocopy for workflow assets
- `notify` plus Claude Code hooks for session waiting and session finished
- Acceptance: `devos apply --dry-run` on a configured machine reports zero changes; on a clean VM `devos apply --yes` passes the new-machine checklist

**Phase 2 — authoring and visibility (done when friction logging and asset creation stop being manual)**
- `add`, `friction`, `sessions`
- Acceptance: a new workflow asset is created without touching a file path by hand; the backlog counts occurrences automatically

**Phase 3 — consumers (done when this chat writes to disk through DevOS verbs)**
- `serve --mcp` exposing `doctor`, `status`, `add`, `sync`, `apply --dry-run` as MCP tools for Claude Desktop
- Window Zen panel rendering `devos status --json` and `devos sessions --json`
- Acceptance: a file lands in the right workflow folder from a Claude Desktop conversation, with an approval step and a backup

## Out of scope

Editing product code, deploys, anything requiring a server, telemetry, and auto-update. DevOS runs locally and only touches the dev environment.

## Risks

| Risk | Mitigation |
|---|---|
| CLI becomes a single point of failure | Underlying scripts stay runnable; every verb names the script it wraps in `--verbose` |
| A write goes wrong | `--dry-run` default, backups, and no writes outside DevOS, `~/.claude`, and Cursor config |
| Scope creep into a product | Verb list above is the contract; new verbs need three logged frictions first |
| PowerShell wrapping gets fragile | Phase 2 ports `sysinfo`/`repo-status` logic to Node, keeping the `.ps1` files as fallbacks |
