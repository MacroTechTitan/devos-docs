'use strict';
// File-install engine shared by `devos apply` and `devos sync`.
//
// It compares a workflow-owned source file against its documented destination,
// reports the difference, and -- only with --yes -- writes it, backing up any
// destination whose content differs first. Design rules 1-3 of
// workflows/dev-environment/docs/devos-cli-plan.md live here:
//   read-only by default, back up before every write, idempotent.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { short } = require('./home');

// Statuses a target can be in before a write.
const SAME = 'same'; // destination already matches the source: nothing to do
const NEW = 'new'; // destination does not exist yet
const DIVERGENT = 'divergent'; // destination exists with different content

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function backupName(dest, now = new Date()) {
  const ts = now.toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-');
  return `${dest}.bak-${ts}`;
}

// Expand a {source, dest} pair into one entry per file. A directory source
// yields every file under it, so a skill folder installs file by file.
function expand(target) {
  const out = [];
  const st = fs.existsSync(target.source) ? fs.statSync(target.source) : null;
  if (!st) return [{ ...target, missingSource: true }];
  if (st.isFile()) return [{ ...target }];
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, e.name);
      const r = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) walk(abs, r);
      else out.push({ ...target, source: abs, dest: path.join(target.dest, r) });
    }
  };
  walk(target.source, '');
  return out;
}

// Classify every file in a target list without writing anything.
function plan(targets) {
  const files = [];
  for (const t of targets) {
    for (const f of expand(t)) {
      if (f.missingSource) {
        files.push({ ...f, status: 'missing-source' });
        continue;
      }
      let status = NEW;
      if (fs.existsSync(f.dest)) status = sha256(f.source) === sha256(f.dest) ? SAME : DIVERGENT;
      files.push({ ...f, status });
    }
  }
  return files;
}

// Copy the files that are not already identical. Every divergent destination is
// backed up first, and each write is verified by re-hashing the destination.
function write(files) {
  const results = [];
  for (const f of files) {
    if (f.status === SAME || f.status === 'missing-source') {
      results.push({ ...f, action: f.status === SAME ? 'unchanged' : 'skipped', backup: null, verified: f.status === SAME });
      continue;
    }
    let backup = null;
    if (f.status === DIVERGENT) {
      backup = backupName(f.dest);
      fs.copyFileSync(f.dest, backup);
    }
    fs.mkdirSync(path.dirname(f.dest), { recursive: true });
    fs.copyFileSync(f.source, f.dest);
    const verified = sha256(f.source) === sha256(f.dest);
    results.push({ ...f, action: f.status === NEW ? 'created' : 'replaced', backup, verified });
  }
  return results;
}

const pending = (files) => files.filter((f) => f.status === NEW || f.status === DIVERGENT);

// One display line per file, for the human-readable report.
function describe(f) {
  const label = {
    [SAME]: 'unchanged',
    [NEW]: 'create   ',
    [DIVERGENT]: 'REPLACE  ',
    'missing-source': 'MISSING  ',
  }[f.status];
  const suffix = f.action === 'replaced' && f.backup ? `  (backup: ${short(f.backup)})` : '';
  const warn = f.verified === false ? '  !! VERIFY FAILED' : '';
  return `    ${label} ${short(f.dest)}${suffix}${warn}`;
}

module.exports = { SAME, NEW, DIVERGENT, plan, write, pending, describe, backupName, sha256 };
