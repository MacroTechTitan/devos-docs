# Environment setup

Run on a new machine, after a Claude Code update, or when prompts come back. Paths are relative to this workflow folder.

- [ ] `node skills/mtt-build-cursor/scripts/apply-settings.js` → bypassPermissions, read block false, deny list present
- [ ] `bash skills/mtt-build-cursor/scripts/setup-all-windows.sh` → no repo overrides printed
- [ ] `type claude` shows the bypass alias
- [ ] `bash scripts/install-assets.sh` → agents and skill in `~/.claude/`
- [ ] Skill zip uploaded in Claude.ai → Settings → Capabilities
- [ ] `bash tools/session-runner/install-runner.sh` → `mtt-run` alias present
- [ ] Session handoff Stop hook in `~/.claude/settings.json` (`/hooks` lists `write-handoff.js`) and `C:\Dev\chat` in the Claude Desktop filesystem MCP scope (`docs/session-handoff.md`)
- [ ] Cursor keybindings merged from `templates/vscode/keybindings.json` (Ctrl+Alt+C / R / G)
- [ ] Cursor default terminal is Git Bash
- [ ] Cursor Agent approvals set to Run Everything (only if using Cursor's own agent)
- [ ] Each active repo has `CLAUDE.md` and `.vscode/settings.json` (window color); `.vscode/tasks.json` optional
- [ ] Cursor, extensions, and Claude Code up to date (`docs/cursor-maintenance.md`)
- [ ] Every Cursor window relaunched with `claude --continue`
