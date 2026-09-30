#!/usr/bin/env bash
# Dry-run log-event.js against the saved hook payloads into a scratch events file.
# Usage: bash run-fixtures.sh <scratch-dir>
# Checks: one line per payload, no tool bodies leaked, exit 0 on garbage, rotation at 5MB.
set -euo pipefail

out="${1:?scratch dir required}"
here="$(cd "$(dirname "$0")" && pwd)"
tool="$here/../log-event.js"
events="$out/events.jsonl"

echo "running $tool -> $events"
mkdir -p "$out"
rm -f "$out"/events*.jsonl

for payload in "$here"/*.json; do
  echo "--- $(basename "$payload")"
  LIVE_BOARD_EVENTS="$events" LIVE_BOARD_DEBUG=1 node "$tool" < "$payload"
done

echo "--- garbage stdin (expect exit 0, no line)"
echo 'not json' | LIVE_BOARD_EVENTS="$events" node "$tool"
echo "exit $?"
echo "--- empty stdin (expect exit 0, no line)"
LIVE_BOARD_EVENTS="$events" node "$tool" < /dev/null
echo "exit $?"

echo "--- events.jsonl"
cat "$events"
echo "--- line count (expect $(ls "$here"/*.json | wc -l))"
wc -l < "$events"
echo "--- body leak check (expect 0)"
grep -c -E 'SECRET BODY|OTHER BODY' "$events" || true

echo "--- rotation: pad to 5MB, then log once"
head -c 5300000 /dev/zero | tr '\0' 'x' > "$events"
LIVE_BOARD_EVENTS="$events" node "$tool" < "$here/stop.json"
ls -la "$out"
echo "--- new events.jsonl after rotation (expect 1 line)"
wc -l < "$events"
