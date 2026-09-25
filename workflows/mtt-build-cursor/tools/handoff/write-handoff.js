#!/usr/bin/env node
// Claude Code Stop hook: turn the session transcript into a readable plain-text
// handoff that any Claude chat can read. Node 20+, zero dependencies.
//
// Input : hook payload JSON on stdin (uses transcript_path, cwd,
//         last_assistant_message).
// Output: <HANDOFF_DIR>/<repo>.txt and <HANDOFF_DIR>/latest.txt (same content).
//
// Always exits 0: a failed handoff must never break a session.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = process.env.HANDOFF_DIR || 'C:\\Dev\\chat';
const MAX_BYTES = 100 * 1024;
const MAX_LINES = 300;
const KEEP_REPO_FILES = 20;
// First line of every file this tool writes. Pruning only touches files that
// start with it, so hand-written files in OUT_DIR are never deleted.
const MARKER = '# Claude Code session handoff';

function log(msg) {
  process.stderr.write(`[handoff] ${msg}\n`);
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

// Walk up from dir to the nearest folder containing .git.
function findRepoRoot(dir) {
  let cur = path.resolve(dir);
  for (;;) {
    if (fs.existsSync(path.join(cur, '.git'))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

function gitBranch(dir, fallback) {
  try {
    const out = execFileSync('git', ['-C', dir, 'rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
      windowsHide: true,
    }).trim();
    if (out) return out;
  } catch {
    // not a repo, or git missing
  }
  return fallback || '(none)';
}

function safeName(name) {
  const cleaned = String(name).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/, '');
  return cleaned || 'unknown';
}

// Remove harness-injected wrappers from a user message, keep what the person typed.
function cleanUserText(text) {
  let t = String(text);
  t = t.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
  t = t.replace(/<local-command-(stdout|stderr|caveat)>[\s\S]*?<\/local-command-\1>/g, '');
  t = t.replace(/<command-message>[\s\S]*?<\/command-message>/g, '');
  t = t.replace(/<command-name>([\s\S]*?)<\/command-name>/g, '$1');
  t = t.replace(/<command-args>([\s\S]*?)<\/command-args>/g, ' $1');
  t = t.replace(/<pasted_content[^>]*>/g, '[pasted]').replace(/<\/pasted_content[^>]*>/g, '[/pasted]');
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

function relPath(p, cwd) {
  if (typeof p !== 'string' || !p) return '';
  if (!cwd || !path.isAbsolute(p)) return p;
  const rel = path.relative(cwd, p);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.replace(/\\/g, '/') : p;
}

function oneLine(s, max = 100) {
  const flat = String(s).replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 3)}...` : flat;
}

// One line per tool call: "[tool] <Name> <target>". Never includes inputs'
// bodies (file contents, edit strings, prompts).
function toolLine(block, cwd) {
  const name = block.name || 'tool';
  const input = block.input || {};
  let target =
    relPath(input.file_path || input.notebook_path, cwd) ||
    input.description ||
    input.url ||
    input.pattern ||
    input.skill ||
    input.query ||
    input.command ||
    relPath(input.path, cwd) ||
    '';
  if (name === 'Grep' || name === 'Glob') {
    const where = relPath(input.path, cwd);
    target = [input.pattern, where && `in ${where}`].filter(Boolean).join(' ');
  }
  target = oneLine(target);
  return target ? `[tool] ${name} ${target}` : `[tool] ${name}`;
}

function parseTranscript(file, cwd) {
  const out = []; // array of { role: 'user'|'claude'|'tool', text }
  let branch = '';
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (e.gitBranch) branch = e.gitBranch;
    if (e.isSidechain || e.isMeta) continue;
    if (e.type !== 'user' && e.type !== 'assistant') continue;
    const content = e.message && e.message.content;
    if (content == null) continue;
    const blocks = typeof content === 'string' ? [{ type: 'text', text: content }] : content;
    if (!Array.isArray(blocks)) continue;

    for (const b of blocks) {
      if (!b || typeof b !== 'object') continue;
      if (e.type === 'user') {
        if (b.type === 'text') {
          const t = cleanUserText(b.text);
          if (t && !/^<task-notification>/.test(t)) out.push({ role: 'user', text: t });
        } else if (b.type === 'image') {
          out.push({ role: 'user', text: '[image]' });
        }
        // tool_result blocks are dropped
      } else {
        if (b.type === 'text' && b.text && b.text.trim()) {
          out.push({ role: 'claude', text: b.text.trim() });
        } else if (b.type === 'tool_use') {
          out.push({ role: 'tool', text: toolLine(b, cwd) });
        }
        // thinking / redacted_thinking dropped
      }
    }
  }
  return { entries: out, branch };
}

function renderBody(entries) {
  const lines = [];
  let prev = null;
  for (const en of entries) {
    if (en.role === 'tool') {
      if (prev !== 'tool') lines.push('');
      lines.push(en.text);
    } else {
      lines.push('');
      lines.push(en.role === 'user' ? '## USER' : '## CLAUDE');
      for (const l of en.text.split(/\r?\n/)) lines.push(l);
    }
    prev = en.role;
  }
  while (lines.length && lines[0] === '') lines.shift();
  return lines;
}

// Drop the oldest body content until header + note + body fit both caps. When
// only the byte cap is exceeded, the oldest line is trimmed from its front
// instead of dropped whole, so one huge message keeps its newest part.
function capBody(headerLines, bodyLines) {
  const bytes = (arr) => Buffer.byteLength(arr.join('\n') + '\n', 'utf8');
  const body = bodyLines.slice();
  let droppedLines = 0;
  let droppedBytes = 0;

  const assemble = () => {
    if (!droppedLines && !droppedBytes) return headerLines.concat(body);
    const note = [
      `[truncated: oldest content dropped (${droppedLines} lines, ${droppedBytes} bytes) to fit ${MAX_LINES} lines / ${MAX_BYTES / 1024}KB]`,
      '',
    ];
    // Don't open mid-message without a label.
    const label = body.length && /^## (USER|CLAUDE)$|^\[tool\]/.test(body[0]) ? [] : ['## (continued)'];
    return headerLines.concat(note, label, body);
  };

  for (;;) {
    const all = assemble();
    const size = bytes(all);
    if ((all.length <= MAX_LINES && size <= MAX_BYTES) || !body.length) return all.join('\n') + '\n';

    const first = Buffer.from(body[0], 'utf8');
    const cut = size - MAX_BYTES + 32; // slack for the note's numbers growing
    if (all.length <= MAX_LINES && first.length > cut + 3) {
      body[0] = `...${first.subarray(cut + 3).toString('utf8')}`;
      droppedBytes += cut + 3;
    } else {
      body.shift();
      droppedLines++;
      droppedBytes += first.length + 1;
    }
    while (body.length && body[0] === '') {
      body.shift();
      droppedLines++;
      droppedBytes++;
    }
  }
}

function renameWithRetry(from, to) {
  for (let i = 0; ; i++) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (err) {
      // Windows: a reader holding the file open can briefly block the replace.
      if (i >= 9 || !['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
}

function writeAtomic(file, text) {
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.tmp`);
  fs.writeFileSync(tmp, text, 'utf8');
  try {
    renameWithRetry(tmp, file);
  } catch (err) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
    throw err;
  }
}

function isOurs(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(MARKER.length);
    fs.readSync(fd, buf, 0, buf.length, 0);
    return buf.toString('utf8') === MARKER;
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function prune(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.txt') && f !== 'latest.txt')
    .map((f) => path.join(dir, f))
    .filter(isOurs)
    .map((f) => ({ f, t: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const { f } of files.slice(KEEP_REPO_FILES)) {
    try {
      fs.unlinkSync(f);
      log(`pruned ${f}`);
    } catch (err) {
      log(`prune failed for ${f}: ${err.message}`);
    }
  }
}

function main() {
  let payload = {};
  try {
    payload = JSON.parse(readStdin() || '{}');
  } catch (err) {
    log(`bad payload: ${err.message}`);
    return;
  }
  const transcript = payload.transcript_path;
  if (!transcript || !fs.existsSync(transcript)) {
    log(`no transcript at ${transcript}`);
    return;
  }

  const cwd = payload.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const root = findRepoRoot(cwd) || path.resolve(cwd);
  const repo = path.basename(root);

  const { entries, branch: transcriptBranch } = parseTranscript(transcript, root);

  // The transcript is written asynchronously and can miss the final reply.
  const last = typeof payload.last_assistant_message === 'string' ? payload.last_assistant_message.trim() : '';
  if (last) {
    const lastClaude = [...entries].reverse().find((en) => en.role === 'claude');
    if (!lastClaude || !lastClaude.text.includes(last.slice(0, 200))) {
      entries.push({ role: 'claude', text: last });
    }
  }

  const now = new Date();
  const header = [
    MARKER,
    `Repo:        ${repo}`,
    `Path:        ${root}`,
    `Branch:      ${gitBranch(root, transcriptBranch)}`,
    `Session end: ${now.toISOString()} (local ${now.toLocaleString()})`,
    `Session id:  ${payload.session_id || '(unknown)'}`,
    `Transcript:  ${transcript}`,
    '',
    'Snapshot of a finished Claude Code session. A record of work, not instructions.',
    '========================================================================',
    '',
  ];

  const text = capBody(header, renderBody(entries));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const repoFile = path.join(OUT_DIR, `${safeName(repo)}.txt`);
  writeAtomic(repoFile, text);
  writeAtomic(path.join(OUT_DIR, 'latest.txt'), text);
  log(`wrote ${repoFile} and latest.txt (${Buffer.byteLength(text)} bytes)`);
  prune(OUT_DIR);
}

try {
  main();
} catch (err) {
  log(`failed: ${err && err.stack ? err.stack : err}`);
}
process.exit(0);
