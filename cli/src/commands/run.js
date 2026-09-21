'use strict';
// devos run -- passes every argument through to the session runner (mtt-run.js).
const { spawnSync } = require('child_process');
const { requireScript } = require('../lib/paths');
const { EXIT, describeCommand } = require('../lib/platform');

const summary = 'Session runner with retry, logging, toasts (passes through to mtt-run.js)';
const usage = `Usage: devos run <prompt-file> [mtt-run options]

Everything after 'run' goes verbatim to
workflows/mtt-build-cursor/tools/session-runner/bin/mtt-run.js, including
--dry-run and --help. Put devos flags (--verbose) before 'run'.

Runner options: --repo <path>  --retries <n>  --fresh  --model <name>  --quiet  --dry-run
Exit: the runner's own code (0 completed, 1 gave up after retries, 2 bad usage).`;

function run(args, opts) {
  const runner = requireScript('sessionRunner');
  const argv = [runner, ...args];
  if (opts.verbose) console.error(`[devos] wraps: ${describeCommand(process.execPath, argv)}`);

  const r = spawnSync(process.execPath, argv, { stdio: 'inherit' });
  if (r.error) {
    console.error(`devos run: failed to start the session runner: ${r.error.message}`);
    return EXIT.PROBLEMS;
  }
  if (r.signal) return EXIT.PROBLEMS;
  return r.status === null ? EXIT.PROBLEMS : r.status;
}

module.exports = { name: 'run', summary, usage, run, passthrough: true };
