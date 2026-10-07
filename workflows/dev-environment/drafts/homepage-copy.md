# DevOS homepage copy (draft — merge into index.mdx, keep existing frontmatter and components)

## Hero

**DevOS**
The operating system for AI-assisted development.

Workflows that capture how the work is actually done — the playbooks, prompts, skills, agents, checklists, and tools — plus one local CLI that runs them. Model-agnostic, tool-agnostic, versioned in git.

[Get started] [Browse workflows]

## The problem

AI coding tools are fast and forgetful. Every session relearns the conventions, re-asks the settled questions, and reinvents the command that worked last week. The intelligence is rented. Nothing compounds.

## The idea

Put the procedure in version control, not in your head or a chat history.

A **workflow** is a folder. It holds the playbook (`WORKFLOW.md`), reference docs, skills, subagents, prompts, checklists, scripts, and tools for one kind of work. Any AI surface can read it. When you switch models or editors, the workflow survives.

## What's inside today

**Workflow 001 — MTT Build (Cursor)**
Building software with Claude Code inside Cursor, end to end.
- 8 stages from environment to merge, with entry and exit criteria
- A skill that encodes launch, continuous execution, interruption recovery, and approval-prompt diagnosis
- Subagents: `repo-explorer` (read-only search), `gate-runner` (verification without fixes)
- A session runner that survives API errors — retries with a recovery preamble, rebuilds state from git diff, logs every attempt, and notifies you
- Prompts for spec requests, sprint kickoff, session recovery, merge and verify
- Checklists for environment setup, window relaunch, and pre-merge
- Templates: `CLAUDE.md`, per-repo window color, auto-opening terminal tabs, keybindings
- A settings baseline that removes approval prompts that protect nothing while keeping deny rules that do

**Workflow 002 — Dev Environment**
The machine, the tools, and the AI layer it all runs on.
- A 14-layer map: OS, window management, editor, shells, toolchain, three AI surfaces, local and remote MCP, repos, hosting, secrets, backup
- `sysinfo` — a dev-focused system report: versions, RAM, disks, GPU, toolchain, AI permission state, listening ports, credential variables by name, and flagged problems
- `repo-status` — every repo's branch, uncommitted work, unpushed commits, and idle time in one screen
- Maintenance routines (daily, weekly, monthly) and a new-machine checklist
- A ranked improvement backlog where friction is logged and earns tooling at three occurrences

## The CLI

One command, every capability:

    devos doctor              # system report + flags, exit 1 if something needs attention
    devos status              # repos: branch, dirty, ahead/behind, idle
    devos run task.md         # unattended session with retry and notifications
    devos apply --dry-run     # show what the baseline would change
    devos sync <workflow>     # put workflow assets where they belong, verified

Read-only by default. Writes print a diff, require `--yes`, and back up first. Every verb speaks `--json`, so hooks, agents, and dashboards consume the same contract.

## Principles

- Workflows are the source of truth; tools are replaceable
- Capture, don't remember
- Friction is data — three occurrences earn a tool
- Read-only by default
- Evidence over narration
- Humans decide, tools execute

## Roadmap

- **Now:** CLI phase 0 (`doctor`, `status`, `run`)
- **Next:** one-command machine setup, session notifications, asset sync
- **Then:** authoring verbs and friction logging
- **Later:** MCP server so a chat can write into workflows with approval; a desktop panel rendering live session and repo state

## Who it's for

Developers running multiple AI coding sessions across multiple projects who are tired of re-explaining their own conventions.
