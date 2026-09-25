#!/usr/bin/env bash
# Check write-handoff.js byte cap, stripping, payload fallback and pruning
# against a synthetic transcript.
# Usage: bash check-limits.sh <work-dir>
set -euo pipefail

dir="${1:?work dir required}"
here="$(cd "$(dirname "$0")" && pwd)"
tool="$here/../write-handoff.js"
fail=0
check() { if eval "$2"; then echo "PASS $1"; else echo "FAIL $1"; fail=1; fi; }

echo "building synthetic data in $dir"
node "$here/make-synthetic.js" "$dir"
HANDOFF_DIR="$dir/out" node "$tool" < "$dir/payload.json"

f="$dir/out/latest.txt"
bytes=$(wc -c < "$f")
lines=$(wc -l < "$f")
echo "latest.txt: $lines lines, $bytes bytes"
check "bytes <= 102400" '[ "$bytes" -le 102400 ]'
check "lines <= 300" '[ "$lines" -le 300 ]'
check "truncation noted" 'grep -q "^\[truncated:" "$f"'
check "first message dropped" '! grep -q "FIRST user message" "$f"'
check "huge line kept its tail" 'grep -q "TAIL_OF_HUGE_LINE" "$f"'
check "thinking stripped" '! grep -q "SECRET THOUGHT" "$f"'
check "file contents stripped" '! grep -q "FILE CONTENTS" "$f"'
check "tool result stripped" '! grep -q "TOOL RESULT" "$f"'
check "system reminder stripped" '! grep -q "REMINDER SHOULD" "$f"'
check "tool one-liner" 'grep -q "^\[tool\] Write src/foo.ts$" "$f"'
check "payload final reply appended" 'grep -q "FINAL REPLY FROM PAYLOAD" "$f"'
ours=$(grep -l "^# Claude Code session handoff" "$dir"/out/*.txt | grep -vc latest.txt)
check "pruned to 20 own files (got $ours)" '[ "$ours" -eq 20 ]'
check "newest own file kept" '[ -f "$dir/out/x.txt" ]'
check "oldest fake pruned" '[ ! -f "$dir/out/fake0.txt" ]'
check "hand-written file untouched" '[ -f "$dir/out/handwritten.txt" ]'
check "no temp files left" '! ls -a "$dir/out" | grep -q "\.tmp$"'

exit "$fail"
