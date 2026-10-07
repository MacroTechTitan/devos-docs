# Session recovery

Use after an API error, crash, relaunch, or stale recap.

Destination: Git Bash / terminal (repo root, claude tab)

```bash
claude --continue
```

Destination: Claude Code (Cursor)

```text
Continue the active task: [one-line task]. The previous response was interrupted; it is not cancelled. Ignore any recap saying you are waiting on answers I already gave.

Decisions already made:
[paste verbatim]

Recover state first: git status, git diff, read touched files. The diff is authoritative, not the prior narrative. Do not redo completed edits. Continue from the first incomplete step through tests, typecheck, lint, and build.

Use literal commands with repo-relative paths; no cd chains, loops, or inline scripts.

Report: done before the interruption, completed now, gate results, needs my approval.
```
