# MTT Build Cursor — Field Guide (Windows)

Habits for running many Claude Code sessions across MTT repos without prompts, collisions, or lost work.

---

## 1. One project, four terminal tabs

Give every repo window the same layout so muscle memory works everywhere.

| Tab | Shell | Use for | Never use for |
|---|---|---|---|
| **claude** | Git Bash | The Claude Code session only | Your own commands |
| **bash** | Git Bash | Quick checks: `git log`, `grep`, reading a log, running one test yourself | Long-running servers |
| **pwsh** | PowerShell | Windows-native work: processes, ports, env vars, services, `winget` | Bash syntax |
| **server** | Git Bash | `npm run dev`, watchers, tailing logs | Anything interactive |

Why separate tabs:
- Claude Code owns its terminal. Typing there talks to Claude, not the shell.
- A dev server started inside Claude's tab blocks the session. Run it in **server** and have Claude hit the endpoint or read the log.
- PowerShell and Git Bash quote differently. Separate tabs stop a bash command landing in PowerShell.
- Your own commands in **bash** never interleave with Claude's output, so you can check git or logs mid-task.

Setting it up in Cursor:
- Default to Git Bash: `"terminal.integrated.defaultProfile.windows": "Git Bash"`.
- New tab with a specific shell: the `+` dropdown in the terminal panel, or Command Palette → **Terminal: Create New Terminal (With Profile)**.
- Rename a tab: right-click → **Rename**. Use **Change Color** so **claude** is always the same color in every window.
- **Terminal: Split Terminal** puts **bash** beside **claude**.
- Auto-open the layout on folder open: copy `templates/vscode/tasks.json` to the repo's `.vscode/`. Test once per machine.

## 2. Tell windows apart instantly

- Copy `templates/vscode/settings.json` into each repo's `.vscode/` and set one title-bar color per product (for example OQ green, DealMatch blue, AI Connect purple, PrivSec red).
- Keep repo folder names distinct; the window title shows the folder.
- Glance at the terminal prompt path before pasting anything.

## 3. Launching and resuming

| Situation | Command (Git Bash, repo root) |
|---|---|
| Fresh session | `claude` (alias adds bypass) |
| Resume the last session in this repo | `claude --continue` |
| Pick from past sessions | `claude --resume` |
| One-shot question, no session | `claude -p "question"` |
| Session stale or confused | Esc, exit, `claude --continue`, paste `prompts/session-recovery.md` |

- Settings load at launch. After changing settings, relaunch every window.
- Always start Claude from the repo root. The working directory decides what it can read without prompts.
- Update Claude Code when windows are idle; auto-update fails while `claude.exe` is running.

## 4. Stop prompts at the source

- `%USERPROFILE%\.claude\settings.json` applies to every window. No startup trigger is needed.
- `bash skills/mtt-build-cursor/scripts/setup-all-windows.sh` adds the bypass alias and finds repo overrides.
- Most remaining prompts come from command shape. Ask for literal commands with explicit paths, not `cd x && grep`, loops, `python -c`, command substitution, or long pipelines.
- Read the prompt text to find the layer; the diagnosis table in `skills/mtt-build-cursor/SKILL.md` maps message to fix.
- Deny rules still block destructive commands under bypass (`references/settings-baseline.md`).

## 5. Parallel work without collisions

- One Claude session per working tree. Two sessions on the same checkout overwrite each other and fight over git state.
- Parallel work in one repo: a git worktree per session, each opened in its own Cursor window.
  `git worktree add ../DealMatchAI-importer -b sprint/12-importer`
- Never `git checkout` in the **bash** tab while Claude is mid-task; switching branches underneath it corrupts its view of the code.
- Clean up with `git worktree remove <path>` after merging, and `git worktree prune` weekly.

## 6. Give Claude files, not walls of text

- Save specs from Claude.ai to `docs/specs/sprint-N-shortname.md` and point Claude Code at the file. Files don't truncate, and the spec becomes Commit 1.
- Reference files with `@path/to/file` in the prompt.
- Paste or drag screenshots of errors instead of retyping them.
- Keep `CLAUDE.md` at each repo root short: commands, stack, conventions, never-dos. Start from `templates/CLAUDE.md`. A long one gets skimmed.
- Put decisions in writing at the top of prompts. When a session loses context, the decisions come back with it.

## 7. Steering a session

| Action | How |
|---|---|
| Interrupt | Esc |
| Rewind and edit an earlier message | Esc twice |
| Plan before editing | Shift+Tab to cycle into plan mode |
| Run a shell command yourself inside Claude | Prefix with `!` |
| Unrelated new task | `/clear` |
| Long conversation | `/compact` |
| Permissions, config, health | `/permissions`, `/config`, `/doctor` |
| Turn off recaps | `/config` |

- Use plan mode for schema changes, refactors, auth, and billing. Approve the plan, then let it run.
- `/clear` between unrelated tasks; leftover context causes wrong assumptions.
- Ignore stale recaps. Recovery starts from `git status` and `git diff`.

## 8. Make "done" mean done

- End every phase with gates: tests, typecheck, lint, build. Ask for actual output, not "should pass." The `gate-runner` agent does this.
- Ask for evidence: row counts, log lines, `/health` responses, PR URLs.
- Standard report shape: done, gate results, needs approval, next step.
- Migrations are written, reviewed, then applied with approval and verified by query.

## 9. Git habits

- One branch per sprint, `sprint/N-shortname`, spec as Commit 1.
- Commit per phase so an interruption costs minutes, not hours.
- Before a risky step, have Claude commit first. A known-good point beats an undo.
- Claude Code runs PRs (`gh pr create --body-file`) and merges.

## 10. Secrets and safety

- Never paste keys into Claude Code or Claude.ai. Keep them in gitignored `.env` files and dashboard env vars.
- Ask Claude to confirm an env var exists, never to print it.
- Treat anything named `prod` as approval-required.
- Deny rules are pattern matches and rewording evades them. Read reports for anything destructive.

## 11. When something goes wrong

| Symptom | Do |
|---|---|
| `Connection lost` / `Waiting for API response` | Let it retry. If the session stops: `claude --continue` + recovery prompt |
| Prompts after a settings change | Relaunch the window; run `setup-all-windows.sh` |
| Extension panel keeps prompting | Use `claude` in the terminal |
| Claude repeats finished work | Stop it; recovery prompt; git diff is authoritative |
| Claude asks questions you already answered | Paste the decisions verbatim at the top of the recovery prompt |
| Git Bash warns about missing `.bash_profile` | Harmless, one-time |
| `claude.exe in use` on update | Harmless; update later |

## 12. Use subagents to protect the main session

- `repo-explorer` does read-only searches. Its output comes back summarized, so the main session's context stays clean.
- `gate-runner` runs gates and reports without trying fixes, so failures are seen before they're patched over.
- Install both with `bash scripts/install-assets.sh`.

## 13. Unattended runs

Long tasks you aren't watching go through `mtt-run` (`tools/session-runner/`), not an interactive session. It retries API errors with a recovery preamble, logs each attempt, and toasts when done or stuck.

    cd /c/Dev/DealMatchAI/repo
    mtt-run docs/tasks/phase-1-streaming-import.md

Keep task prompts in the repo under `docs/tasks/` so they're versioned and reusable. In interactive sessions use Ctrl+Alt+C (relaunch), Ctrl+Alt+R (recover), Ctrl+Alt+G (run gates).

## 14. Hygiene

- Close each sprint with a SPRINT_LOG entry and the next step.
- Delete merged branches and stale worktrees weekly.
- Re-run the environment checklist after Claude Code updates; updates can add settings.
- Update Cursor and clear its caches when it feels slow or an update sticks: `docs/cursor-maintenance.md`.
