'use strict';
// Where user configuration lives. Resolved the same way the workflow scripts do
// (apply-settings.js reads USERPROFILE then HOME; the bash scripts write to ~),
// so overriding both env vars points the CLI and the scripts it delegates to at
// the same disposable directory. That is how the tests avoid the real profile.
const path = require('path');

function configHome() {
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) {
    const err = new Error('Neither USERPROFILE nor HOME is set, so there is no config directory to work in.');
    err.exitCode = 1;
    throw err;
  }
  return home;
}

const claudeDir = () => path.join(configHome(), '.claude');
const bashrc = () => path.join(configHome(), '.bashrc');

// Print paths relative to the config home so output does not carry the profile
// path around unnecessarily.
function short(p) {
  const home = configHome();
  const rel = path.relative(home, p);
  return rel && !rel.startsWith('..') ? `~/${rel.split(path.sep).join('/')}` : p;
}

module.exports = { configHome, claudeDir, bashrc, short };
