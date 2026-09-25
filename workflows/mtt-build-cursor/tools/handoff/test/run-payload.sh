#!/usr/bin/env bash
# Dry-run write-handoff.js against a saved hook payload into a scratch dir.
# Usage: bash run-payload.sh <payload.json> <out-dir> [repo-name]
set -euo pipefail

payload="${1:?payload json path required}"
out="${2:?output dir required}"
here="$(cd "$(dirname "$0")" && pwd)"
tool="$here/../write-handoff.js"

echo "running $tool with $payload -> $out"
mkdir -p "$out"
HANDOFF_DIR="$out" node "$tool" < "$payload"

echo "--- files"
ls -la "$out"
echo "--- stats: lines / bytes"
wc -l -c "$out/latest.txt"
echo "--- tool JSON leak check (expect 0)"
grep -c -E '"(type|tool_use_id|input)":' "$out/latest.txt" || true
repo="${3:-}"
if [ -n "$repo" ]; then
  cmp "$out/latest.txt" "$out/$repo.txt" && echo "latest.txt identical to $repo.txt"
fi
