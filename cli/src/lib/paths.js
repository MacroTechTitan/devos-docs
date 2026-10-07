'use strict';
// Resolve everything from the CLI's own location, never from process.cwd(),
// so `devos` behaves the same from any directory (including through npm link,
// which symlinks the package; __dirname resolves to the real path).
const fs = require('fs');
const path = require('path');

const CLI_ROOT = path.resolve(__dirname, '..', '..');
const DEVOS_ROOT = path.resolve(CLI_ROOT, '..');
const WORKFLOWS = path.join(DEVOS_ROOT, 'workflows');

const SCRIPTS = {
  sysinfo: path.join(WORKFLOWS, 'dev-environment', 'scripts', 'sysinfo.ps1'),
  repoStatus: path.join(WORKFLOWS, 'dev-environment', 'scripts', 'repo-status.ps1'),
  sessionRunner: path.join(WORKFLOWS, 'mtt-build-cursor', 'tools', 'session-runner', 'bin', 'mtt-run.js'),
};

// Returns the script path, or throws with a message naming what is missing.
function requireScript(key) {
  const p = SCRIPTS[key];
  if (!fs.existsSync(p)) {
    const err = new Error(`DevOS script not found: ${p}\n(DevOS root resolved to ${DEVOS_ROOT})`);
    err.exitCode = 1;
    throw err;
  }
  return p;
}

module.exports = { CLI_ROOT, DEVOS_ROOT, WORKFLOWS, SCRIPTS, requireScript };
