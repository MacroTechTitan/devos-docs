# Workflows

A **workflow** is a self-contained folder holding everything needed to run one kind of work: the playbook, reference docs, skills, agents, prompts, checklists, scripts, tools, and templates.

Workflows are the source of truth. Tools (Claude Code, Claude.ai, Cursor, ChatGPT/Codex) consume them; they do not own them.

## Map

```
workflows/
├── README.md                     This file
├── _template/                    Copy to start a new workflow
└── mtt-build-cursor/             Workflow 001: building MTT software with Claude Code in Cursor
    ├── WORKFLOW.md           Playbook: stages, roles, rules, asset index
    ├── docs/                 Guides (claude-code-tips.md, cursor-maintenance.md)
    ├── skills/               mtt-build-cursor
    ├── agents/               repo-explorer, gate-runner
    ├── prompts/              spec request, kickoff, recovery, merge
    ├── checklists/           environment, relaunch, pre-merge
    ├── scripts/              install-assets.sh, clear-cursor-cache.ps1 (+ skill scripts)
    ├── tools/                mtt-run session runner (auto-retry on API errors)
    └── templates/            CLAUDE.md, .vscode settings, tasks, keybindings
```

## Workflow anatomy

| Folder | Holds | Consumed by |
|---|---|---|
| `WORKFLOW.md` | The playbook: purpose, stages, roles, entry/exit criteria, where every asset is | Humans, Claude.ai, Claude Code |
| `docs/` | Reference guides and standards | Humans, Claude.ai projects |
| `skills/` | Skill folders (`SKILL.md` + references/scripts) | Claude.ai (upload zip), Claude Code (`~/.claude/skills/`), plugins |
| `agents/` | Claude Code subagent definitions | `~/.claude/agents/` or a repo's `.claude/agents/` |
| `prompts/` | Copy-paste prompts for recurring moments | Claude Code, Claude.ai |
| `checklists/` | Short go/no-go lists | Humans |
| `scripts/` | Setup and automation | Git Bash / PowerShell / node |
| `templates/` | Files dropped into repos | New and existing repos |
| `tools/` | Runnable tools owned by the workflow | Git Bash / node |

## Conventions

- Folder names are kebab-case. Workflow numbers live in `WORKFLOW.md` frontmatter.
- Every paste-able block names its destination: Claude Code (Cursor), Git Bash / terminal, PowerShell, web / browser, Supabase SQL Editor, Render, Vercel, GitHub.
- A skill lives in exactly one workflow. Other workflows reference it by path.
- Scripts are idempotent and back up before writing.
- Secrets never live in DevOS.

## Adding a workflow

1. Copy `_template/` to `<name>/`.
2. Fill in `WORKFLOW.md` first. Add assets only when a stage needs them.
3. Add it to the index below.

## Workflow index

| # | Workflow | Status |
|---|---|---|
| 001 | [MTT Build — Cursor](mtt-build-cursor/WORKFLOW.md) | Active |

## Plugins (planned)

A build script will package `*/skills` and `*/agents` into Claude Code plugins (private `mtt`, public MIT `maximus`). Until then, install assets with each workflow's `scripts/install-assets.sh`.
