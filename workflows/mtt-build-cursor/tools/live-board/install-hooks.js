#!/usr/bin/env node
// Merge (or remove) the live-board hook in ~/.claude/settings.json.
//
//   node install-hooks.js              add log-event.js to PostToolUse, Notification, Stop
//   node install-hooks.js --uninstall  remove only the log-event.js entries
//
// Merge-only: every other hook entry (notify.ps1, write-handoff.js, inbox-hook.mjs, ...)
// is left byte-for-byte as it was. Idempotent. Writes a timestamped backup first and
// re-parses the result before replacing the file.

'use strict';

const fs = require('fs');
const path = require('path');

const SETTINGS = process.env.CLAUDE_SETTINGS || path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'settings.json');
const SCRIPT = path.join(__dirname, 'log-event.js');
const NODE = 'C:\\Program Files\\nodejs\\node.exe';
const EVENTS = ['PostToolUse', 'Notification', 'Stop'];
const uninstall = process.argv.includes('--uninstall');

const isOurs = (h) => h && Array.isArray(h.args) && h.args.some((a) => /live-board[\\/]+log-event\.js$/i.test(a));

function entry() {
  return {
    hooks: [
      {
        type: 'command',
        command: fs.existsSync(NODE) ? NODE : 'node',
        args: [SCRIPT],
        async: true,
        timeout: 10,
      },
    ],
  };
}

const original = fs.readFileSync(SETTINGS, 'utf8');
const settings = JSON.parse(original);
settings.hooks = settings.hooks || {};

const changes = [];
for (const [event, groups] of Object.entries(settings.hooks)) {
  if (!Array.isArray(groups)) continue;
  const kept = groups.filter((g) => !(g && Array.isArray(g.hooks) && g.hooks.length && g.hooks.every(isOurs)));
  if (kept.length !== groups.length) {
    settings.hooks[event] = kept;
    changes.push(`removed from ${event}`);
  }
}
if (!uninstall) {
  for (const event of EVENTS) {
    settings.hooks[event] = settings.hooks[event] || [];
    settings.hooks[event].push(entry());
    changes.push(`added to ${event}`);
  }
}
for (const event of Object.keys(settings.hooks)) {
  if (Array.isArray(settings.hooks[event]) && settings.hooks[event].length === 0) delete settings.hooks[event];
}

const next = JSON.stringify(settings, null, 2) + '\n';
if (next === original) {
  console.log('settings.json unchanged');
  process.exit(0);
}
JSON.parse(next); // validate before touching the real file

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const backup = `${SETTINGS}.bak-live-board-${stamp}`;
fs.copyFileSync(SETTINGS, backup);
const tmp = `${SETTINGS}.tmp-live-board`;
fs.writeFileSync(tmp, next);
fs.renameSync(tmp, SETTINGS);

console.log(`backup: ${backup}`);
console.log(`${SETTINGS}: ${changes.join(', ')}`);
