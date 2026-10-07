// Test helper: build a synthetic transcript + payload and seed a prune test dir.
const fs = require('fs');
const path = require('path');
const [dir] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const t = path.join(dir, 'synthetic.jsonl');
const lines = [];
lines.push(JSON.stringify({ type: 'user', message: { role: 'user', content: 'FIRST user message (should be dropped)' } }));
lines.push(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'thinking', thinking: 'SECRET THOUGHT' }, { type: 'text', text: 'A'.repeat(150 * 1024) + 'TAIL_OF_HUGE_LINE' }] } }));
lines.push(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: 'C:\\Dev\\x\\src\\foo.ts', content: 'FILE CONTENTS SHOULD NOT APPEAR' } }] } }));
lines.push(JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'x', content: 'TOOL RESULT SHOULD NOT APPEAR' }] } }));
lines.push(JSON.stringify({ type: 'user', message: { content: 'last user msg <system-reminder>REMINDER SHOULD NOT APPEAR</system-reminder>' } }));
fs.writeFileSync(t, lines.join('\n') + '\n');
fs.writeFileSync(path.join(dir, 'payload.json'), JSON.stringify({ transcript_path: t, cwd: 'C:\\Dev\\x', session_id: 'synthetic', last_assistant_message: 'FINAL REPLY FROM PAYLOAD' }));
const out = path.join(dir, 'out');
fs.mkdirSync(out, { recursive: true });
for (let i = 0; i < 25; i++) {
  const f = path.join(out, `fake${i}.txt`);
  fs.writeFileSync(f, '# Claude Code session handoff\nfake\n');
  fs.utimesSync(f, new Date(2020, 0, 1 + i), new Date(2020, 0, 1 + i));
}
fs.writeFileSync(path.join(out, 'handwritten.txt'), 'not ours\n');
console.log('synthetic ready in', dir);
