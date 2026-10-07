#!/usr/bin/env bash
# One-time: make `claude` always launch in bypass mode, then find repo settings that override the global file.
# Usage (Git Bash): bash scripts/setup-all-windows.sh [scan_root]
ROOT="${1:-/c/Dev}"

if grep -q "dangerously-skip-permissions" ~/.bashrc 2>/dev/null; then
  echo "alias: already present in ~/.bashrc"
else
  echo "alias claude='claude --dangerously-skip-permissions'" >> ~/.bashrc
  echo "alias: added to ~/.bashrc (open a new terminal or run: source ~/.bashrc)"
fi

echo "global settings:"
grep -n -E "defaultMode|blockReadsOutsideWorkingDirectories" ~/.claude/settings.json 2>/dev/null || echo "  ~/.claude/settings.json missing or has neither key"

echo "repo overrides under $ROOT (no lines = none):"
find "$ROOT" -maxdepth 5 -name node_modules -prune -o -path "*/.claude/settings*.json" -print 2>/dev/null \
  | xargs -r grep -n -E "defaultMode|blockReadsOutsideWorkingDirectories" 2>/dev/null

echo "Next: in each Cursor window press Esc, exit Claude Code, run: claude --continue"
