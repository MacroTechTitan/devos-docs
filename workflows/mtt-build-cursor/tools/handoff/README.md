# Session handoff

Writes a readable plain-text snapshot of each Claude Code session to
`C:\Dev\chat\`, so a separate Claude chat can read what Claude Code has been
doing ("read the dealmatch handoff").

## Files

| File | Purpose |
|---|---|
| `write-handoff.js` | The Stop hook. Node 20+, zero dependencies |
| `hooks.settings.json` | The `Stop` entry to merge into `~/.claude/settings.json` |

`C:\Dev\chat\README.md` explains the output folder to a chat that has never seen
it. It lives outside any repo and is not version controlled.

## Install

1. Merge the `Stop` entry from `hooks.settings.json` into the `hooks.Stop`
   array of `C:\Users\<you>\.claude\settings.json`, next to the existing
   `notify.ps1` entry. Back the file up first, append only, and re-parse the
   result to confirm it is still valid JSON.
2. Check the two absolute paths in the snippet: `node.exe` (`where node`) and
   the script location.
3. Restart Claude Code.

The hook runs with `async: true`, so it never delays the end of a turn.

## What it writes

Every time Claude finishes responding:

- `C:\Dev\chat\<repo>.txt` — latest session for that repo
- `C:\Dev\chat\latest.txt` — same content; latest session in any repo

`<repo>` is the folder name of the repo's main worktree
(`git rev-parse --path-format=absolute --git-common-dir`, then its parent), so
all linked worktrees share one file. A generic main-worktree name (`repo`,
`main`, `src`, `app`, `code`, `trunk`) is replaced by its parent folder name:
`C:\Dev\DealMatchAI\wt-migrate` and `C:\Dev\DealMatchAI\repo` both write
`DealMatchAI.txt`. Without git, the `cwd` folder name is used. Each run
overwrites the file.

Header: repo, main repo path, worktree path, git branch, session end timestamp
(UTC and local), session id, transcript path.

Full user-facing doc: `../../docs/session-handoff.md`.

Body, in order:

- `## USER` — your messages, with harness wrappers (`<system-reminder>`, command
  stdout, task notifications) removed
- `## CLAUDE` — Claude's text replies
- `[tool] <Name> <target>` — one line per tool call, e.g. `[tool] Edit src/foo.ts`.
  Target is the file path (relative to the repo), the Bash `description`, the
  URL or the search pattern

Dropped: thinking blocks, tool inputs and results, file contents, meta and
subagent (sidechain) entries.

The transcript is written asynchronously and can miss the final reply, so the
hook appends `last_assistant_message` from the Stop payload when the transcript
doesn't already contain it.

## Limits

- Capped at 100KB or 300 lines, whichever hits first. The oldest content is
  dropped and a `[truncated: ...]` line records how much. A single oversized
  message is trimmed from its front so its newest part survives.
- Writes go to a temp file in the same folder, then rename, so readers never see
  a half-written file.
- Keeps the 20 most recent `<repo>.txt` files. Pruning only touches files whose
  first line is `# Claude Code session handoff`; anything else in the folder is
  left alone.

## Configuration

`HANDOFF_DIR` overrides the output folder (default `C:\Dev\chat`).

The hook always exits 0 and logs to stderr with a `[handoff]` prefix. A failed
handoff never breaks a session.

## Testing

```
bash C:/Dev/DevOS/workflows/mtt-build-cursor/tools/handoff/test/run-payload.sh <payload.json> <out-dir> [repo-name]
bash C:/Dev/DevOS/workflows/mtt-build-cursor/tools/handoff/test/check-limits.sh <work-dir>
```

```
node C:/Dev/DevOS/workflows/mtt-build-cursor/tools/handoff/test/check-resolve.js "C:\Dev\DealMatchAI\wt-migrate=DealMatchAI"
```

`check-resolve.js` checks repo-name resolution for `<dir>=<expected>` pairs.
`run-payload.sh` replays a saved hook payload into a scratch folder.
`check-limits.sh` builds a synthetic transcript (`make-synthetic.js`) and checks
the caps, stripping, payload fallback and pruning. Point both at a scratch
folder, never `C:\Dev\chat`.
