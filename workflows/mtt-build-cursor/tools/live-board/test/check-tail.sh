#!/usr/bin/env bash
# Run server.js on a scratch events file and check the SSE tail: appends,
# a torn line completed later, and rotation (events.jsonl -> events.1.jsonl).
# Usage: bash check-tail.sh <scratch-dir> [port=7778]
set -euo pipefail

out="${1:?scratch dir required}"
port="${2:-7778}"
here="$(cd "$(dirname "$0")" && pwd)"
events="$out/tail-events.jsonl"
probe_log="$out/tail-probe.log"

mkdir -p "$out"
rm -f "$out"/tail-events*.jsonl "$probe_log"
echo '{"ts":"2026-01-01T00:00:00.000Z","sessionId":"seed0000","repo":"seed","branch":"","event":"Stop","tool":"","target":"","summary":"backlog line"}' > "$events"

echo "starting server on $port for $events"
LIVE_BOARD_EVENTS="$events" LIVE_BOARD_PORT="$port" node "$here/../server.js" > "$out/tail-server.log" 2>&1 &
server=$!
trap 'kill $server 2>/dev/null || true' EXIT
sleep 1

node "$here/sse-probe.js" 8 "$port" > "$probe_log" 2>&1 &
probe=$!
sleep 1

line() { printf '{"ts":"%s","sessionId":"%s","repo":"tail","branch":"t","event":"PostToolUse","tool":"Bash","target":"%s","summary":""}\n' "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" "$1" "$2"; }

echo "append 1"
line aaaa0001 "append-1" >> "$events"
sleep 0.5
echo "torn line: first half, then second half"
full="$(line aaaa0002 "torn-2")"
printf '%s' "${full:0:40}" >> "$events"
sleep 0.5
printf '%s\n' "${full:40}" >> "$events"
sleep 0.5
echo "rotate, then append to the new file"
mv "$events" "$out/tail-events.1.jsonl"
line aaaa0003 "after-rotate-3" >> "$events"
sleep 0.5
line aaaa0004 "after-rotate-4" >> "$events"

wait $probe || true
echo "--- probe"
cat "$probe_log"
echo "--- expect: backlog 1, then append-1, torn-2, after-rotate-3, after-rotate-4"
for t in append-1 torn-2 after-rotate-3 after-rotate-4; do
  if grep -q "$t" "$probe_log"; then echo "ok   $t"; else echo "MISS $t"; fi
done
