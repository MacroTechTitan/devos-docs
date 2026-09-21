# Scripts

| Script | Run (PowerShell) | Does |
|---|---|---|
| `sysinfo.ps1` | `powershell -ExecutionPolicy Bypass -File scripts\sysinfo.ps1` | Dev-focused system report: OS/build, CPU, RAM, disks, GPU, toolchain versions, Cursor/Claude Desktop/Window Zen, Claude Code permissions and installed skills/agents, dev ports in use, credential env vars by name, and flagged problems. `-Json` for machine-readable, `-Save` to write a dated copy. |
| `repo-status.ps1` | `powershell -ExecutionPolicy Bypass -File scripts\repo-status.ps1` | Every git repo under `C:\Dev`: branch, uncommitted count, ahead/behind, days idle, worktrees; then a "needs attention" list. `-DirtyOnly`, `-Root`, `-Depth`. |

Both are read-only. `sysinfo.ps1` reports credential variable **names** only, never values, so its output is safe to paste into a chat.
