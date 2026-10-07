# Recommended setup — Claude Desktop + Cursor

The current, tested arrangement of surfaces on the Windows desktop.

## Surfaces and what each owns

| Surface | Owns | Does not |
|---|---|---|
| Claude Desktop | Architecture, specs, SQL verification, DevOS and workflow authoring, writing files to disk via local MCP | Run sprints, touch product repos directly |
| Cursor (desktop app) | Editor, terminals, Claude Code sessions, Cursor agent | Host MCP servers for planning chats |
| Claude Code (in Cursor) | Implementation, gates, git, PRs, reports | Apply migrations or mutate production unapproved |
| Claude.ai in a browser | Fallback on machines without Desktop | Local file access of any kind |

Rule of thumb: if the output is a file for the machine, use Claude Desktop. If the output is a commit, use Claude Code in Cursor.

## Why both desktop apps

Claude Desktop can host local (stdio) MCP servers; a browser tab cannot. That is what removes the zip-download-unzip-robocopy loop: a planning chat writes into DevOS directly, with an approval per write. Cursor cannot host MCP for a Claude.ai conversation - its MCP support serves its own agent.

## Claude Desktop MCP config

File: %APPDATA%\Claude\claude_desktop_config.json

    {
      "mcpServers": {
        "filesystem": {
          "command": "npx",
          "args": [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "C:\\Dev\\DevOS",
            "C:\\Users\\macro\\.claude"
          ]
        }
      }
    }

Scope stays at those two paths. Never C:\Dev - a planning chat has no business reaching product repos.

Known issue: a reported Windows regression where the filesystem server connects and lists tools but never receives file calls. If writes silently do nothing, fall back to Claude Code prompts and check for a newer build.

## Later (per devos-cli-plan.md phase 3)

Replace the generic filesystem server with the DevOS MCP server exposing verbs (doctor, status, add, sync, apply --dry-run). Intent-level tools that validate paths, back up, and return a diff - rather than raw writes anywhere in the tree.

## Setup order on a new machine

1. Cursor, signed in, default terminal profile Git Bash
2. Claude Code installed; workflow 001 install scripts run
3. Claude Desktop installed, signed in, MCP config above, restart
4. Verify: ask Desktop to list C:\Dev\DevOS\workflows - it should see _template, mtt-build-cursor, dev-environment
5. Verify: a Claude Code session runs a task with no approval prompts
