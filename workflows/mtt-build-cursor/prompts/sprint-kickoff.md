# Sprint kickoff

Destination: Claude Code (Cursor)

```text
Start sprint [N]-[shortname] per docs/MTTBuild.md.

1. Pull master and confirm it is clean.
2. Create branch sprint/[N]-[shortname].
3. Commit docs/specs/sprint-[N]-[shortname].md as Commit 1.
4. Execute every phase in the spec continuously.

Routine reversible work inside this repo is pre-authorized. Use literal commands with repo-relative paths; no cd chains, loops, inline scripts, or command substitution for inspection. Use the repo-explorer agent for searches and gate-runner at the end of each phase.

Stop only for: migrations to apply, production or external mutations, secrets, destructive git, or unresolved product decisions.

Commit per phase. Report per phase: done, gate results, needs approval, next.
```
