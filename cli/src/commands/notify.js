'use strict';
// devos notify <title> <message> -- wraps
// workflows/mtt-build-cursor/tools/notifications/notify.ps1.
// The toast itself stays that script's job; this only passes arguments.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { WORKFLOWS, DEVOS_ROOT } = require('../lib/paths');
const { EXIT, UsageError, assertWindows, findPowerShell, psArgs, describeCommand } = require('../lib/platform');

const summary = 'Desktop toast, as used by the Claude Code hooks';
const usage = `Usage: devos notify <title> <message> [--dry-run] [--verbose] [--json]

Shows a Windows toast via the workflow's notify.ps1. Works from any directory.

  devos notify DevOS "Sprint finished"
  devos notify "" "Waiting for input"    empty title: notify.ps1 derives the
                                         repo name from the working directory

Exit: 0 shown (notify.ps1 never fails a session), 2 usage or unsupported platform.`;

const SCRIPT = path.join(WORKFLOWS, 'mtt-build-cursor', 'tools', 'notifications', 'notify.ps1');

function parse(args) {
  const positional = [];
  for (const a of args) {
    if (a.startsWith('-')) throw new UsageError(`devos notify: unknown option '${a}'\n\n${usage}`);
    positional.push(a);
  }
  if (positional.length < 2) {
    throw new UsageError(`devos notify: needs a title and a message (got ${positional.length}).\n\n${usage}`);
  }
  if (positional.length > 2) {
    throw new UsageError(`devos notify: expected 2 arguments, got ${positional.length}. Quote the message.\n\n${usage}`);
  }
  const [title, message] = positional;
  if (!message.trim()) throw new UsageError(`devos notify: the message cannot be empty.\n\n${usage}`);
  return { title, message };
}

function run(args, opts) {
  const { title, message } = parse(args);
  assertWindows('notify');
  if (!fs.existsSync(SCRIPT)) {
    const err = new Error(`devos notify: notify.ps1 not found under ${path.relative(DEVOS_ROOT, SCRIPT)}`);
    err.exitCode = EXIT.PROBLEMS;
    throw err;
  }

  // An empty title is passed through as "no -Title", which is what keeps
  // notify.ps1's own repo-name fallback working.
  const scriptArgs = ['-Message', message];
  if (title !== '') scriptArgs.unshift('-Title', title);

  const shell = findPowerShell();
  const argv = psArgs(SCRIPT, scriptArgs);
  const cmd = describeCommand(shell.exe, argv);

  if (opts.verbose) console.error(`[devos] wraps: ${cmd}\n[devos] shell: ${shell.exe} ${shell.version}`);
  if (opts.dryRun) {
    const payload = { dryRun: true, title: title === '' ? null : title, message, derivesTitle: title === '', shell: shell.exe, command: cmd };
    console.log(opts.json ? JSON.stringify(payload, null, 2) : `dry-run: would run\n  ${cmd}`);
    return EXIT.OK;
  }

  const r = spawnSync(shell.exe, argv, { encoding: 'utf8', windowsHide: true, timeout: 60000 });
  if (r.error) {
    const err = new Error(`devos notify: failed to run ${shell.exe}: ${r.error.message}`);
    err.exitCode = EXIT.PROBLEMS;
    throw err;
  }
  // notify.ps1 always exits 0 on purpose: a missed toast must not break a session.
  const payload = { shown: r.status === 0, title: title === '' ? null : title, message, shell: shell.exe, exitCode: r.status };
  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else console.log(`notified: ${title === '' ? '(title from working directory)' : title} -- ${message}`);
  if (r.stderr && r.stderr.trim() && opts.verbose) console.error(r.stderr.trim());

  return r.status === 0 ? EXIT.OK : EXIT.PROBLEMS;
}

module.exports = { name: 'notify', summary, usage, run };
