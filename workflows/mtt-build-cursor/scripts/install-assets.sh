#!/usr/bin/env bash
# Copy this workflow's Claude Code agents and skills into ~/.claude.
# Usage (Git Bash, from the workflow folder): bash scripts/install-assets.sh
HERE="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p ~/.claude/agents ~/.claude/skills
cp -v "$HERE"/agents/*.md ~/.claude/agents/
cp -rv "$HERE"/skills/mtt-build-cursor ~/.claude/skills/
echo "Installed. Relaunch Claude Code windows to load them."
