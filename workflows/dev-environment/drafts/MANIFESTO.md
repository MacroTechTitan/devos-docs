# DevOS Manifesto (draft — merge into the repo's existing manifesto/constitution)

## What DevOS is

DevOS is the operating system for how work gets done here: a versioned set of **workflows**, each a self-contained folder holding the playbook, docs, skills, agents, prompts, checklists, scripts, and tools for one kind of work. Plus one local CLI that runs them.

It is not an AI product. The intelligence is rented and replaceable. What compounds is the captured procedure: the decisions already made, the prompts already refined, the checks already automated.

## Principles

**1. Workflows are the source of truth.** Claude Code, Claude Desktop, Cursor, ChatGPT, and OpenClaw all consume DevOS. None of them owns it. When a tool changes or is replaced, the workflow survives.

**2. Capture, don't remember.** Anything discovered twice gets written down once. A prompt that worked, a setting that caused an outage, a command shape that avoids approval prompts — these are artifacts, not memories.

**3. Friction is data.** Every interruption gets logged with a count. Three occurrences earn a tool. Fewer than three and it stays a documented practice. This is the only path from annoyance to automation.

**4. The CLI is the contract.** Every capability is a verb. Hooks call verbs, agents call verbs, UIs render verb output. Nothing is implemented twice.

**5. Read-only by default.** Writes require explicit consent, print a diff first, and back up what they touch. Speed comes from removing approvals that protect nothing, never from removing the ones that do.

**6. Measure before changing.** Environment changes land one at a time, with before-and-after evidence. Batched changes cannot be diagnosed.

**7. The machine is disposable; the config is not.** Everything needed to rebuild a working environment is versioned. A dead drive costs hours, not weeks.

**8. Evidence over narration.** A task is done when tests, logs, row counts, or health checks say so. Not when something reports that it should be.

**9. Humans decide, tools execute.** Product decisions, approvals, production, and secrets stay with the operator. Everything else is delegated, and delegation improves by sharpening the workflow, not by loosening the boundary.

**10. Secrets never live here.** Not in workflows, not in scripts, not in script output. Reports name variables; they never print values.

## How it grows

A workflow starts as one file: `WORKFLOW.md`, the stages and the rules. Assets appear only when a stage needs one. Most workflows never need a tool. The ones that do earn it by hurting three times.
