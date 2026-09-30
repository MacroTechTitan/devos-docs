#!/usr/bin/env node
// DevOS live board: local, real-time view of Claude Code hook events.
// Node 20+, zero dependencies. Binds 127.0.0.1 only.
//
//   GET /        board.html (self-contained page, inline CSS/JS)
//   GET /events  Server-Sent Events: recent backlog, then new events.jsonl lines as they land
//   GET /status  { status, doctor } from `devos status --json` / `devos doctor --json`, cached 30s
//
// Tailing is event-driven: fs.watch on the events folder plus a byte offset.
// No polling loops.

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');

const HOST = '127.0.0.1';
const PORT = Number(process.env.LIVE_BOARD_PORT) || 7777;
const EVENTS = process.env.LIVE_BOARD_EVENTS || 'C:\\Dev\\chat\\events.jsonl';
const PAGE = path.join(__dirname, 'board.html');
const BACKLOG_LINES = 500;
const BACKLOG_BYTES = 512 * 1024;
const STATUS_TTL_MS = 30 * 1000;
const HEARTBEAT_MS = 20 * 1000;

function log(msg) {
  process.stdout.write(`${new Date().toISOString()} ${msg}\n`);
}

// ---------------------------------------------------------------- tail ----

const clients = new Set();
const backlog = []; // last BACKLOG_LINES raw JSON lines
let pos = 0; // bytes of EVENTS already read
let ino = null; // detects rotation (events.jsonl renamed to events.1.jsonl)
let partial = ''; // trailing text without a newline yet
let reading = false;
let again = false;

function remember(line) {
  backlog.push(line);
  if (backlog.length > BACKLOG_LINES) backlog.splice(0, backlog.length - BACKLOG_LINES);
}

function broadcast(line) {
  const frame = `data: ${line}\n\n`;
  for (const res of clients) res.write(frame);
}

function takeLines(text, live) {
  const parts = (partial + text).split('\n');
  partial = parts.pop();
  for (const raw of parts) {
    const line = raw.trim();
    if (!line) continue;
    try {
      JSON.parse(line);
    } catch {
      continue; // torn or foreign line
    }
    remember(line);
    if (live) broadcast(line);
  }
}

function statEvents() {
  try {
    return fs.statSync(EVENTS);
  } catch {
    return null;
  }
}

// Read everything appended since `pos`. Coalesces bursts of watch events.
function readNew() {
  if (reading) {
    again = true;
    return;
  }
  const st = statEvents();
  if (!st) return;
  if ((ino !== null && st.ino !== ino) || st.size < pos) {
    pos = 0; // rotated or truncated: start the new file from the top
    partial = '';
  }
  ino = st.ino;
  if (st.size === pos) return;
  reading = true;
  const start = pos;
  pos = st.size;
  const stream = fs.createReadStream(EVENTS, { start, end: st.size - 1, encoding: 'utf8' });
  stream.on('data', (chunk) => takeLines(chunk, true));
  stream.on('error', (e) => log(`read error: ${e.message}`));
  stream.on('close', () => {
    reading = false;
    if (again) {
      again = false;
      readNew();
    }
  });
}

// Seed the backlog from the end of the file, then only follow new bytes.
function seed() {
  const st = statEvents();
  if (!st) return;
  ino = st.ino;
  pos = st.size;
  const len = Math.min(st.size, BACKLOG_BYTES);
  if (!len) return;
  const buf = Buffer.alloc(len);
  const fd = fs.openSync(EVENTS, 'r');
  try {
    fs.readSync(fd, buf, 0, len, st.size - len);
  } finally {
    fs.closeSync(fd);
  }
  let text = buf.toString('utf8');
  if (len < st.size) text = text.slice(text.indexOf('\n') + 1); // drop the cut first line
  takeLines(text, false);
  partial = '';
}

function watch() {
  const dir = path.dirname(EVENTS);
  const name = path.basename(EVENTS).toLowerCase();
  fs.mkdirSync(dir, { recursive: true });
  const watcher = fs.watch(dir, (type, filename) => {
    if (!filename || String(filename).toLowerCase() === name) readNew();
  });
  watcher.on('error', (e) => log(`watch error: ${e.message}`));
}

// -------------------------------------------------------------- status ----

let statusCache = null; // { at, body }
let statusInflight = null;

function devosCommand() {
  const js = process.env.DEVOS_JS || path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@mtt', 'devos', 'bin', 'devos.js');
  if (fs.existsSync(js)) return { file: process.execPath, pre: [js], shell: false };
  return { file: 'devos', pre: [], shell: true };
}

function runDevos(verb) {
  const cmd = devosCommand();
  return new Promise((resolve) => {
    execFile(
      cmd.file,
      [...cmd.pre, verb, '--json'],
      { timeout: 60 * 1000, windowsHide: true, shell: cmd.shell, maxBuffer: 16 * 1024 * 1024 },
      (err, stdout, stderr) => {
        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve({ error: (err && err.message) || String(stderr || 'no JSON output').slice(0, 500) });
        }
      },
    );
  });
}

// Stale-while-revalidate: doctor takes ~10s, so once the cache is warm a
// request never waits; an expired cache is served and refreshed behind it.
function getStatus() {
  const fresh = statusCache && Date.now() - statusCache.at < STATUS_TTL_MS;
  if (!fresh && !statusInflight) refreshStatus();
  return statusCache ? Promise.resolve(statusCache.body) : statusInflight;
}

function refreshStatus() {
  if (!statusInflight) {
    statusInflight = Promise.all([runDevos('status'), runDevos('doctor')])
      .then(([status, doctor]) => {
        const body = JSON.stringify({ generated: new Date().toISOString(), status, doctor });
        statusCache = { at: Date.now(), body };
        return body;
      })
      .finally(() => {
        statusInflight = null;
      });
  }
  return statusInflight;
}

// -------------------------------------------------------------- server ----

// Loopback bind already blocks other machines; the Host check also blocks
// DNS-rebinding pages in the local browser from reading the feed.
function hostAllowed(req) {
  const host = String(req.headers.host || '').toLowerCase();
  return host === `127.0.0.1:${PORT}` || host === `localhost:${PORT}`;
}

const server = http.createServer((req, res) => {
  if (!hostAllowed(req)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    fs.readFile(PAGE, (err, html) => {
      if (err) {
        res.writeHead(500).end('board.html missing');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    });
    res.write('retry: 2000\n\n');
    res.write('event: reset\ndata: {}\n\n'); // client clears state, so reconnects don't duplicate
    for (const line of backlog) res.write(`data: ${line}\n\n`);
    res.write('event: live\ndata: {}\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/status') {
    getStatus().then(
      (body) => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(body);
      },
      (e) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      },
    );
    return;
  }

  res.writeHead(404).end('not found');
});

setInterval(() => {
  for (const res of clients) res.write(': ping\n\n');
}, HEARTBEAT_MS).unref();

seed();
watch();
getStatus().catch(() => {}); // warm the cache; doctor takes several seconds

server.on('error', (e) => {
  log(`server error: ${e.message}`);
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  log(`live board on http://${HOST}:${PORT}  (tailing ${EVENTS}, ${backlog.length} backlog lines)`);
});
