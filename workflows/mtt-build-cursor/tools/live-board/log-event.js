#!/usr/bin/env node
// Claude Code hook: append one JSON line per event to C:\Dev\chat\events.jsonl
// for the live board (server.js). Node 20+, zero dependencies.
//
// Input : hook payload JSON on stdin (PostToolUse, Notification, Stop, ...).
// Output: {ts, sessionId, repo, branch, event, tool, target, summary} + "\n".
//
// Fast path only: no child processes (git is read straight from .git), one
// stat, one append. Always exits 0: a failed log line must never break a session.

'use strict';

const fs = require('fs');
const path = require('path');

const EVENTS = process.env.LIVE_BOARD_EVENTS || 'C:\\Dev\\chat\\events.jsonl';
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TARGET = 120;
const MAX_SUMMARY = 120;

// Same rule as tools/handoff: a main checkout with a generic folder name
// (C:\Dev\DealMatchAI\repo) is named after its parent.
const GENERIC_NAMES = new Set(['repo', 'main', 'src', 'app', 'code', 'trunk']);

function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return '';
  }
}

// Walk up from cwd to the nearest .git (dir = main checkout, file = linked
// worktree) and resolve { repo, branch, root } without spawning git.
function resolveGit(cwd) {
  let dir = path.resolve(cwd);
  for (;;) {
    const dotGit = path.join(dir, '.git');
    let st = null;
    try {
      st = fs.statSync(dotGit);
    } catch {}
    if (st) {
      let gitDir = dotGit;
      let commonDir = dotGit;
      if (st.isFile()) {
        const m = /^gitdir:\s*(.+)$/m.exec(readText(dotGit));
        if (!m) break;
        gitDir = path.resolve(dir, m[1].trim());
        const common = readText(path.join(gitDir, 'commondir'));
        commonDir = common ? path.resolve(gitDir, common) : gitDir;
      }
      const mainRoot =
        path.basename(commonDir).toLowerCase() === '.git' ? path.dirname(commonDir) : commonDir.replace(/\.git$/i, '');
      let repo = path.basename(mainRoot);
      if (GENERIC_NAMES.has(repo.toLowerCase()) && path.dirname(mainRoot) !== mainRoot) {
        repo = path.basename(path.dirname(mainRoot));
      }
      const head = readText(path.join(gitDir, 'HEAD'));
      const ref = /^ref:\s*refs\/heads\/(.+)$/.exec(head);
      const branch = ref ? ref[1] : head ? `(detached ${head.slice(0, 7)})` : '';
      return { repo, branch, root: dir };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return { repo: path.basename(path.resolve(cwd)), branch: '', root: '' };
}

function oneLine(s, max) {
  const flat = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 3)}...` : flat;
}

function relPath(p, root) {
  if (typeof p !== 'string' || !p) return '';
  if (!root || !path.isAbsolute(p)) return p;
  const rel = path.relative(root, p);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.replace(/\\/g, '/') : p;
}

// What the tool acted on. Never includes bodies (file contents, edit strings, prompts).
function toolTarget(input, root) {
  if (!input || typeof input !== 'object') return '';
  return (
    relPath(input.file_path || input.notebook_path || input.path, root) ||
    input.command ||
    input.pattern ||
    input.url ||
    input.query ||
    input.skill ||
    input.description ||
    ''
  );
}

function summaryFor(p) {
  switch (p.hook_event_name) {
    case 'PostToolUse': {
      const res = p.tool_response;
      if (res && typeof res === 'object' && (res.is_error || res.interrupted)) return res.interrupted ? 'interrupted' : 'error';
      const input = p.tool_input || {};
      // Bash/PowerShell description is the human label; target already holds the command.
      return input.command && input.description ? input.description : '';
    }
    case 'Notification':
      return p.message || p.notification_type || '';
    case 'Stop':
    case 'SubagentStop':
      return p.last_assistant_message || '';
    case 'UserPromptSubmit':
      return 'prompt submitted';
    default:
      return p.message || '';
  }
}

function rotateIfNeeded() {
  let size = 0;
  try {
    size = fs.statSync(EVENTS).size;
  } catch {
    return;
  }
  if (size < MAX_BYTES) return;
  try {
    fs.renameSync(EVENTS, EVENTS.replace(/\.jsonl$/, '.1.jsonl'));
  } catch {
    // another hook rotated it first, or the file is locked; append anyway
  }
}

function main() {
  const raw = fs.readFileSync(0, 'utf8');
  if (!raw.trim()) return;
  const p = JSON.parse(raw);
  const cwd = p.cwd || process.cwd();
  const git = resolveGit(cwd);
  const line = {
    ts: new Date().toISOString(),
    sessionId: String(p.session_id || '').slice(0, 8),
    repo: git.repo,
    branch: git.branch,
    event: p.hook_event_name || '',
    tool: p.tool_name || '',
    target: oneLine(toolTarget(p.tool_input, git.root || cwd), MAX_TARGET),
    summary: oneLine(summaryFor(p), MAX_SUMMARY),
  };
  rotateIfNeeded();
  fs.appendFileSync(EVENTS, `${JSON.stringify(line)}\n`);
}

const started = process.hrtime.bigint();
try {
  main();
} catch {
  // never block or fail the session
}
if (process.env.LIVE_BOARD_DEBUG) {
  process.stderr.write(`[live-board] ${Number(process.hrtime.bigint() - started) / 1e6}ms\n`);
}
process.exitCode = 0;
