---
name: mtt-build-cursor
description: Standard operating instructions for Macro Tech Titan development work performed with Claude Code inside Cursor. Use when preparing Claude/Cursor prompts, resuming interrupted coding sessions, reducing routine approval prompts, configuring autonomous repo execution, or handing development work to Claude Code across MTT projects such as TelePath OS, DevOS, AI Connect, DealMatch, Founders Showcase, Maximus, and related repositories.
---

# MTT Build Cursor

Apply this operating model whenever producing instructions for Claude Code or Cursor on Macro Tech Titan development work.

## Launch commands

For Claude Code with Claude permission prompts bypassed:

```bash
claude --dangerously-skip-permissions
```

To resume the most recent Claude Code conversation in the current repository with permission prompts bypassed:

```bash
claude --dangerously-skip-permissions --continue
```

To choose an older resumable Claude Code session:

```bash
claude --dangerously-skip-permissions --resume
```

For Cursor Agent, use **Run Everything** under **Settings > Agents > Approvals & Execution** when the operator explicitly wants autonomous local execution. If the installed Cursor version supports the session command, use:

```text
/run-everything on
```

Treat Cursor approvals and Claude Code approvals as separate permission layers. Enabling one does not necessarily disable the other.

Never claim these modes make destructive or production actions safe. They only reduce confirmation prompts.

## Continuous execution rule

Include a compact version of this rule in Claude/Cursor development prompts unless the operator says otherwise:

```text
Routine reversible work inside the active repository is pre-authorized.
Do not ask for routine reads, searches, edits, tests, builds, lint, typecheck,
formatting, or read-only git operations.

Avoid python -c, inline Python, eval, dynamic command strings, unnecessary
command substitution, heredoc inspection scripts, and complex pipelines for
ordinary repository inspection. Prefer simple explicit commands with literal
paths such as rg, grep, find, cat, head, tail, sed, and existing project scripts.
Split complex inspection into simple commands when possible.
Do not chain cd with reads (cd dir && grep ...); pass absolute or repo-relative
literal paths directly so the read block can verify them.

Stay inside the active repository. Do not broaden filesystem access merely to
avoid an approval prompt.

Stop for destructive or irreversible actions, secrets/credential actions,
production or external mutations not already authorized, database migrations
requiring operator approval, force-push/shared-history rewrites, or genuine
unresolved product/architecture decisions.
```

## Apply to every window (no startup trigger needed)

User settings at `%USERPROFILE%\.claude\settings.json` apply to every Claude Code session in every Cursor window and repo. There is no startup hook to add. Settings load when a session launches, so windows opened before a settings change keep prompting until relaunched.

Skills and plugins do not stop prompts; they only shape how Claude works. Prompts are controlled by settings, launch flags, and command shape.

One-time setup, Git Bash:

```bash
bash scripts/setup-all-windows.sh
```

The script (idempotent) adds `alias claude='claude --dangerously-skip-permissions'` to `~/.bashrc` and scans `C:\Dev` for repo-level `.claude/settings*.json` files that override `defaultMode` or `blockReadsOutsideWorkingDirectories`. Any line it prints is a repo override to fix; no output means the global file governs.

Then in each Cursor window: Esc, exit Claude Code, run `claude --continue` (the alias adds bypass).

If a relaunched window still prompts, the source is elsewhere:

- Claude Code extension panel: known bug ignores bypass. Use `claude` in the integrated terminal.
- Cursor Agent: separate layer. Settings > Agents > Approvals & Execution > Run Everything.
- Subagents via the Agent tool: known bug prompts under bypass; no clean fix.
- Read block: see "Diagnose repeated approval prompts".

## Recover from interrupted Claude responses

Treat API errors, stopped response streams, terminal disconnects, and incomplete assistant messages as interruptions rather than task cancellation.

On resume:

1. Read repository instructions such as `CLAUDE.md`.
2. Inspect `git status` and `git diff`.
3. Inspect files relevant to the active task.
4. Determine what was actually written before interruption.
5. Continue from the first incomplete step.
6. Do not recreate, overwrite, or redo completed work merely because the narrative response was cut off.
7. Finish the originally required tests, typecheck, lint, and build where applicable.

Treat the filesystem and git diff as authoritative for implementation state.

A useful resume instruction is:

```text
Continue the active task. Recover progress from git status/diff and the working
tree. Do not redo completed work. Continue from the first incomplete step
through implementation and the originally required verification gates.
```

## Diagnose repeated approval prompts

If approvals continue despite permissive settings, identify which layer produced the prompt before changing configuration:

- Cursor Agent approval/classifier/sandbox
- Claude Code permission system
- repository/workspace boundary protection
- destructive-operation protection
- external/production action protection
- a command Claude generated that the permission parser cannot safely analyze

Prefer changing Claude's command shape rather than weakening unrelated protections. In particular, replace inline Python, dynamic shell strings, command substitution, `cd ... &&` chains, loops, and complicated pipelines with simple literal commands when they are only being used for repository inspection.

Known prompt signatures and their layer:

| Prompt text contains | Layer | Fix |
|---|---|---|
| "blockReadsOutsideWorkingDirectories" / "parser cannot analyze" / "path computed at run time" | Claude Code read block | Reshape command first; if intended, set the flag false (see `references/settings-baseline.md`) |
| Claude Code "Allow this bash command?" despite bypass, in the extension panel | Cursor extension bug | Run `claude` in the integrated terminal instead |
| Prompt from an Agent-tool subagent under bypass | Known Claude Code bug (Windows/Git Bash) | Broaden `permissions.allow`; cannot fully eliminate |
| Cursor Agent approval / sandbox dialog | Cursor | Run Everything setting |

Settings load at session launch. After any settings change, relaunch affected windows with `claude --dangerously-skip-permissions --continue`; running sessions keep old values.

## Verify settings before assuming they applied

Never trust that a settings edit landed. Check every layer, in precedence order, with one literal command (note the spaces between paths):

```bash
grep -n -E "blockReadsOutsideWorkingDirectories|defaultMode" ~/.claude/settings.json <repo>/.claude/settings.json <repo>/.claude/settings.local.json 2>/dev/null
```

To apply the MTT baseline (bypass mode, read block off, full deny list) as an idempotent merge with backup and validation, run `scripts/apply-settings.js`. Full baseline, deny rationale, and Cursor-side settings: `references/settings-baseline.md`.

## Plugin and toolkit roadmap

When the operator asks about Cursor/Claude Code plugins, shortcuts, hooks, DevOS tooling, or porting Maximus skills, read `references/plugin-roadmap.md`.

## Prompt formatting

When giving the user content intended to paste into Claude Code or Cursor, label it exactly:

**Claude**

Then provide one copyable fenced `text` block.

Keep prompts decisive and scoped. Preserve completed acceptance work. Tell Claude not to restart unrelated tasks.

## Project safety

Do not infer that a feature-development pause in one MTT project freezes other MTT projects. Apply scope controls only to the active repository/project unless explicitly told otherwise.

Do not ask the operator to use browser DevTools or paste manual console diagnostics when automated tests, application diagnostics, server logs, or admin instrumentation can establish the result.
