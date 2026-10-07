#!/usr/bin/env bash
# Install mtt-run: adds a `mtt-run` alias plus session keybindings info.
# Usage (Git Bash): bash install-runner.sh
HERE="$(cd "$(dirname "$0")" && pwd)"
LINE="alias mtt-run='node \"$HERE/bin/mtt-run.js\"'"
if grep -qF "mtt-run.js" ~/.bashrc 2>/dev/null; then
  echo "alias: already present in ~/.bashrc"
else
  echo "$LINE" >> ~/.bashrc
  echo "alias: added -> $LINE"
fi
node --version >/dev/null 2>&1 || echo "WARNING: node not found on PATH"
command -v claude >/dev/null 2>&1 || echo "WARNING: claude not found on PATH"
echo "Open a new terminal (or: source ~/.bashrc), then: mtt-run <prompt-file>"
