'use strict';
// Which workflow assets have a documented consumer location, and where.
//
// The mapping is transcribed from the workflows' own docs and scripts, which
// stay the authority and stay runnable by hand:
//   agents + skill -> workflows/mtt-build-cursor/scripts/install-assets.sh
//   notify.ps1     -> workflows/mtt-build-cursor/tools/notifications/README.md
// A workflow with no documented destination gets no targets; the CLI does not
// invent one.
const fs = require('fs');
const path = require('path');
const { WORKFLOWS } = require('./paths');
const { claudeDir } = require('./home');
const { UsageError } = require('./platform');

// Workflow names are a single path segment under workflows/. Anything with a
// separator, a drive letter, or a dot segment is rejected before it touches the
// filesystem.
function resolveWorkflow(name) {
  if (!name) throw new UsageError('devos sync: name a workflow, e.g. devos sync mtt-build-cursor');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name === '.' || name === '..') {
    throw new UsageError(`devos sync: '${name}' is not a valid workflow name (one folder under workflows/, letters, digits, dot, dash, underscore).`);
  }
  const dir = path.join(WORKFLOWS, name);
  const rel = path.relative(WORKFLOWS, dir);
  if (rel !== name || path.isAbsolute(rel)) {
    throw new UsageError(`devos sync: '${name}' resolves outside workflows/.`);
  }
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new UsageError(`devos sync: no workflow '${name}' under workflows/. Known: ${list().join(', ')}`);
  }
  return dir;
}

// Workflow folders that exist on disk (a workflow is a folder with WORKFLOW.md).
function list() {
  if (!fs.existsSync(WORKFLOWS)) return [];
  return fs
    .readdirSync(WORKFLOWS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(WORKFLOWS, e.name, 'WORKFLOW.md')))
    .map((e) => e.name)
    .sort();
}

// Documented source -> destination pairs for a workflow.
function targets(name) {
  const dir = resolveWorkflow(name);
  const claude = claudeDir();
  if (name === 'mtt-build-cursor') {
    return [
      { key: 'agents', label: 'Claude Code subagents', source: path.join(dir, 'agents'), dest: path.join(claude, 'agents'), authority: 'scripts/install-assets.sh' },
      { key: 'skill', label: 'mtt-build-cursor skill', source: path.join(dir, 'skills', 'mtt-build-cursor'), dest: path.join(claude, 'skills', 'mtt-build-cursor'), authority: 'scripts/install-assets.sh' },
      { key: 'notify', label: 'notification hook script', source: path.join(dir, 'tools', 'notifications', 'notify.ps1'), dest: path.join(claude, 'hooks', 'notify.ps1'), authority: 'tools/notifications/README.md' },
    ];
  }
  // dev-environment's assets (docs, checklists, scripts) are read and run in
  // place; no doc gives them an install destination.
  return [];
}

module.exports = { resolveWorkflow, list, targets };
