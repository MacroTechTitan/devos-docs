# Merge, verify, log

Destination: Claude Code (Cursor)

```text
Merge PR #[N] and close out the sprint.

1. Confirm checks are green and the branch is current with master.
2. gh pr merge [N] --merge --admin --delete-branch=false
3. Verify the deploy: Render/Vercel status, /health response, last 50 log lines with no new errors.
4. If the deploy fails: revert first, report, stop.
5. Add a SPRINT_LOG entry directly on master: date, sprint, what shipped, migrations applied, follow-ups.
6. Pull master locally.

Report: merge commit, deploy evidence, SPRINT_LOG entry, next step.
```
