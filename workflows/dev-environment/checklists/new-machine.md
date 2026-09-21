# New machine checklist

Bare Windows box to working MTT environment.

## Base
- [ ] Windows updated; machine renamed
- [ ] Git for Windows (Git Bash) installed; `user.name` and `user.email` set
- [ ] Node LTS + pnpm; `node -v`, `pnpm -v` resolve
- [ ] GitHub CLI; `gh auth login` complete
- [ ] Cursor installed; signed in; default terminal profile = Git Bash
- [ ] Claude Code installed; `claude doctor` clean
- [ ] Claude Desktop installed; signed in
- [ ] MTT Window Zen installed
- [ ] Supabase CLI, Vercel CLI as needed

## MTT layer
- [ ] `C:\Dev` created; DevOS cloned to `C:\Dev\DevOS`
- [ ] Workflow 001 `scripts/install-assets.sh` (skill + agents)
- [ ] Workflow 001 `tools/session-runner/install-runner.sh` (`mtt-run`)
- [ ] Workflow 001 `skills/mtt-build-cursor/scripts/apply-settings.js` (permissions baseline)
- [ ] Workflow 001 `skills/mtt-build-cursor/scripts/setup-all-windows.sh` (alias + override scan)
- [ ] Cursor keybindings merged from workflow 001 `templates/vscode/keybindings.json`
- [ ] Claude Desktop MCP config: filesystem server scoped to `C:\Dev\DevOS` and `~/.claude`
- [ ] Skill uploaded in Claude.ai → Settings → Capabilities
- [ ] Product repos cloned; `.env` files restored from the password manager, never from a repo

## Verify
- [ ] `powershell -File workflows\dev-environment\scripts\sysinfo.ps1` — no missing tools
- [ ] `powershell -File workflows\dev-environment\scripts\repo-status.ps1` — every repo clean
- [ ] `type claude` shows the bypass alias
- [ ] A throwaway Claude Code task runs start to finish with no approval prompts
