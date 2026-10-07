'use strict';
// devos apply -- the Phase 1 contract from devos-cli-plan.md:
// "settings baseline, aliases, agents, skill, keybindings -- diff then --yes".
//
// Each target delegates to the workflow asset that owns it. The CLI decides
// what needs doing and adds the safety the plan requires (preview, backup,
// verification); it does not reimplement the baseline or the alias logic.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { WORKFLOWS } = require('../lib/paths');
const { EXIT, UsageError, assertWindows, describeCommand } = require('../lib/platform');
const { bashrc, claudeDir, short } = require('../lib/home');
const installer = require('../lib/installer');
const workflows = require('../lib/workflows');

const summary = 'Settings baseline, aliases, agents, skill, keybindings -- diff, then --yes';
const usage = `Usage: devos apply [--only <target>] [--yes] [--json] [--dry-run] [--verbose]

Brings this machine up to the workflow baseline. Read-only unless --yes:
without it the differences are printed and it exits 0. Divergent files are
backed up to <file>.bak-<timestamp> before being replaced, and a second run
changes nothing.

Targets (--only takes one):
  settings     ~/.claude/settings.json baseline   (mtt-build-cursor skill: scripts/apply-settings.js)
  aliases      claude + mtt-run aliases in ~/.bashrc
               (scripts/setup-all-windows.sh, tools/session-runner/install-runner.sh)
  agents       Claude Code subagents -> ~/.claude/agents
  skill        mtt-build-cursor skill -> ~/.claude/skills
  keybindings  not applied: see below

keybindings has no automated merge. templates/README.md documents it as a
manual merge into Cursor's user keybindings, and the plan does not say how to
reconcile existing bindings, so apply reports it and changes nothing.
'devos apply --only keybindings' exits 2 rather than guessing.

Exit: 0 ok or nothing to do, 1 a write or verification failed, 2 usage.`;

const MTT = path.join(WORKFLOWS, 'mtt-build-cursor');
const APPLY_SETTINGS = path.join(MTT, 'skills', 'mtt-build-cursor', 'scripts', 'apply-settings.js');
const SETUP_ALL = path.join(MTT, 'skills', 'mtt-build-cursor', 'scripts', 'setup-all-windows.sh');
const INSTALL_RUNNER = path.join(MTT, 'tools', 'session-runner', 'install-runner.sh');

const TARGETS = ['settings', 'aliases', 'agents', 'skill', 'keybindings'];

function parse(args) {
  let only = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--only') {
      only = args[++i];
      if (!only) throw new UsageError(`devos apply: --only needs a target (${TARGETS.join(', ')})\n\n${usage}`);
      if (!TARGETS.includes(only)) throw new UsageError(`devos apply: unknown target '${only}'. One of: ${TARGETS.join(', ')}\n\n${usage}`);
    } else {
      throw new UsageError(`devos apply: unexpected argument '${a}'\n\n${usage}`);
    }
  }
  return only;
}

// --- settings -------------------------------------------------------------
// apply-settings.js --dry-run prints the permissions block it would end up
// with, so that is used as the desired state instead of restating the baseline.
function settingsDetect() {
  const file = path.join(claudeDir(), 'settings.json');
  const r = spawnSync(process.execPath, [APPLY_SETTINGS, '--dry-run'], { encoding: 'utf8', windowsHide: true, timeout: 60000 });
  if (r.error || r.status !== 0) {
    return { status: 'error', detail: `apply-settings.js --dry-run failed: ${(r.stderr || r.error?.message || '').trim()}`, file };
  }
  let desired;
  try {
    desired = JSON.parse(r.stdout);
  } catch (e) {
    return { status: 'error', detail: `apply-settings.js --dry-run did not return JSON: ${e.message}`, file };
  }

  let current = {};
  if (fs.existsSync(file)) {
    try {
      current = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      return { status: 'error', detail: `${short(file)} is not valid JSON (${e.message}); fix or move it before applying`, file };
    }
  }
  const perms = current.permissions || {};
  const changes = [];
  if (perms.defaultMode !== desired.defaultMode) changes.push(`permissions.defaultMode: ${JSON.stringify(perms.defaultMode)} -> ${JSON.stringify(desired.defaultMode)}`);
  if (perms.blockReadsOutsideWorkingDirectories !== desired.blockReadsOutsideWorkingDirectories) {
    changes.push(`permissions.blockReadsOutsideWorkingDirectories: ${JSON.stringify(perms.blockReadsOutsideWorkingDirectories)} -> ${JSON.stringify(desired.blockReadsOutsideWorkingDirectories)}`);
  }
  const have = new Set(perms.deny || []);
  const addDeny = (desired.deny || []).filter((d) => !have.has(d));
  if (addDeny.length) changes.push(`permissions.deny: add ${addDeny.length} rule(s)`);
  if (current.skipDangerousModePermissionPrompt !== true) changes.push('skipDangerousModePermissionPrompt: -> true');

  return { status: changes.length ? 'would-change' : 'ok', changes, file, exists: fs.existsSync(file) };
}

function settingsApply() {
  const r = spawnSync(process.execPath, [APPLY_SETTINGS], { encoding: 'utf8', windowsHide: true, timeout: 120000 });
  // apply-settings.js takes its own .bak-<ts> copy before writing.
  return { ok: !r.error && r.status === 0, detail: (r.stderr || '').trim() || (r.error && r.error.message) || '', command: describeCommand('node', [APPLY_SETTINGS]) };
}

// --- aliases --------------------------------------------------------------
// Same markers the scripts grep for, so detection agrees with their guards.
const ALIASES = [
  { key: 'claude-bypass', marker: 'dangerously-skip-permissions', script: SETUP_ALL, label: "claude bypass alias" },
  { key: 'mtt-run', marker: 'mtt-run.js', script: INSTALL_RUNNER, label: 'mtt-run alias' },
];

function aliasesDetect() {
  const file = bashrc();
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const missing = ALIASES.filter((a) => !text.includes(a.marker));
  return { status: missing.length ? 'would-change' : 'ok', missing, file, exists: fs.existsSync(file) };
}

function aliasesApply(missing) {
  const file = bashrc();
  let backup = null;
  if (fs.existsSync(file)) {
    backup = installer.backupName(file);
    fs.copyFileSync(file, backup);
  }
  const ran = [];
  for (const a of missing) {
    const r = spawnSync('bash', [a.script], { encoding: 'utf8', windowsHide: true, timeout: 300000 });
    ran.push({ key: a.key, ok: !r.error && r.status === 0, detail: (r.error && r.error.message) || (r.status !== 0 ? (r.stderr || '').trim() : '') });
  }
  return { backup, ran, ok: ran.every((r) => r.ok) };
}

// --- agents / skill -------------------------------------------------------
function fileTargets(keys) {
  return workflows.targets('mtt-build-cursor').filter((t) => keys.includes(t.key));
}

function run(args, opts) {
  const only = parse(args);
  assertWindows('apply');
  if (only === 'keybindings') {
    throw new UsageError(
      'devos apply --only keybindings: not implemented. templates/README.md documents the keybindings merge as manual ' +
        "(Cursor: Ctrl+Shift+P -> Open Keyboard Shortcuts (JSON)), and the plan does not specify how to reconcile existing bindings.\n" +
        `Template: ${short(path.join(MTT, 'templates', 'vscode', 'keybindings.json'))}`
    );
  }

  const want = (t) => !only || only === t;
  const write = Boolean(opts.yes) && !opts.dryRun;
  const report = { written: write, targets: {} };
  let problems = 0;
  let pendingCount = 0;
  const lines = [];

  // settings
  if (want('settings')) {
    const d = settingsDetect();
    let applied = null;
    if (d.status === 'error') problems++;
    else if (d.status === 'would-change') {
      pendingCount += d.changes.length;
      if (write) {
        applied = settingsApply();
        if (!applied.ok) problems++;
      }
    }
    report.targets.settings = { status: d.status, file: d.file ? short(d.file) : null, changes: d.changes || [], detail: d.detail || null, applied: applied ? { ok: applied.ok, detail: applied.detail || null } : null };
    lines.push(`  settings     ${short(d.file)}  [authority: skills/mtt-build-cursor/scripts/apply-settings.js]`);
    if (d.status === 'error') lines.push(`    ERROR    ${d.detail}`);
    else if (!d.changes.length) lines.push('    unchanged already matches the baseline');
    else for (const c of d.changes) lines.push(`    ${write ? 'applied  ' : 'change   '} ${c}`);
    if (applied && !applied.ok) lines.push(`    ERROR    apply-settings.js failed: ${applied.detail}`);
  }

  // aliases
  if (want('aliases')) {
    const d = aliasesDetect();
    let applied = null;
    if (d.status === 'would-change') {
      pendingCount += d.missing.length;
      if (write) {
        applied = aliasesApply(d.missing);
        if (!applied.ok) problems++;
      }
    }
    report.targets.aliases = {
      status: d.status,
      file: short(d.file),
      missing: d.missing.map((m) => m.key),
      applied: applied ? { ok: applied.ok, backup: applied.backup ? short(applied.backup) : null, ran: applied.ran } : null,
    };
    lines.push(`  aliases      ${short(d.file)}  [authority: setup-all-windows.sh, install-runner.sh]`);
    if (!d.missing.length) lines.push('    unchanged both aliases present');
    else for (const m of d.missing) lines.push(`    ${write ? 'applied  ' : 'add      '} ${m.label}`);
    if (applied && applied.backup) lines.push(`    backup   ${short(applied.backup)}`);
    if (applied && !applied.ok) for (const r of applied.ran.filter((x) => !x.ok)) lines.push(`    ERROR    ${r.key}: ${r.detail}`);
  }

  // agents and skill: plain file installs, shared with `devos sync`
  const keys = TARGETS.filter((t) => (t === 'agents' || t === 'skill') && want(t));
  if (keys.length) {
    const targets = fileTargets(keys);
    const files = installer.plan(targets);
    const todo = installer.pending(files);
    pendingCount += todo.length;
    const results = write && todo.length ? installer.write(files) : null;
    const shown = results || files;
    const missingSrc = shown.filter((f) => f.status === 'missing-source');
    if (missingSrc.length || (results && results.some((f) => f.verified === false))) problems++;
    for (const t of targets) {
      const mine = shown.filter((f) => f.key === t.key);
      report.targets[t.key] = {
        status: mine.every((f) => f.status === installer.SAME) ? 'ok' : 'would-change',
        files: mine.map((f) => ({ dest: short(f.dest), status: f.status, action: f.action || null, backup: f.backup ? short(f.backup) : null, verified: f.verified === undefined ? null : f.verified })),
      };
      lines.push(`  ${t.key.padEnd(12)} ${short(t.dest)}  [authority: ${t.authority}]`);
      for (const f of mine) lines.push(installer.describe(f));
      if (!mine.length) lines.push('    (no files)');
    }
  }

  // keybindings: reported, never touched
  if (want('keybindings')) {
    report.targets.keybindings = { status: 'manual', reason: 'no automated merge specified; templates/README.md documents a manual merge into Cursor user keybindings', template: short(path.join(MTT, 'templates', 'vscode', 'keybindings.json')) };
    lines.push('  keybindings  Cursor user keybindings  [authority: templates/README.md]');
    lines.push('    manual   merge templates/vscode/keybindings.json by hand (Ctrl+Shift+P -> Open Keyboard Shortcuts (JSON))');
  }

  report.pending = pendingCount;
  report.problems = problems;

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`APPLY${only ? ` --only ${only}` : ''}${write ? '' : '  (preview -- nothing written)'}`);
    console.log(lines.join('\n'));
    console.log('');
    if (problems) console.log(`${problems} target(s) failed.`);
    else if (write) console.log(pendingCount ? 'Applied. Relaunch Claude Code windows to pick up settings, agents and the skill.' : 'Nothing to do; already at the baseline.');
    else if (pendingCount) console.log(`${pendingCount} change(s) pending. Re-run with --yes to apply.`);
    else console.log('Already at the baseline. Nothing to do.');
  }

  return problems ? EXIT.PROBLEMS : EXIT.OK;
}

module.exports = { name: 'apply', summary, usage, run };
