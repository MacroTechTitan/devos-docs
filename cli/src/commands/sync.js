'use strict';
// devos sync <workflow> -- install a workflow's assets into their documented
// consumer locations and verify each one landed.
const { EXIT, UsageError } = require('../lib/platform');
const { short } = require('../lib/home');
const installer = require('../lib/installer');
const workflows = require('../lib/workflows');

const summary = 'Copy a workflow\'s assets to their documented destinations and verify each landed';
const usage = `Usage: devos sync <workflow> [--yes] [--json] [--verbose]

Copies the named workflow's assets to the locations its own docs and scripts
give them, then re-hashes each destination to confirm it landed.

Without --yes nothing is written: the differences are printed and it exits 0.
With --yes, any destination whose content differs is backed up to
<file>.bak-<timestamp> first. Running it twice changes nothing the second time.

  devos sync mtt-build-cursor           show what would change
  devos sync mtt-build-cursor --yes     write it

Workflow names resolve only under workflows/ (one folder, no paths).

Exit: 0 ok or nothing to do, 1 a write or verification failed, 2 usage.`;

function parse(args) {
  let name = null;
  for (const a of args) {
    if (a.startsWith('-')) throw new UsageError(`devos sync: unknown option '${a}'\n\n${usage}`);
    if (name) throw new UsageError(`devos sync: one workflow at a time (got '${name}' and '${a}').\n\n${usage}`);
    name = a;
  }
  if (!name) throw new UsageError(`devos sync: name a workflow. Known: ${workflows.list().join(', ')}\n\n${usage}`);
  return name;
}

function run(args, opts) {
  const name = parse(args);
  workflows.resolveWorkflow(name); // validates existence and rejects traversal
  const targets = workflows.targets(name);

  if (targets.length === 0) {
    const payload = { workflow: name, targets: [], files: [], written: false, note: 'no documented consumer destinations for this workflow' };
    if (opts.json) console.log(JSON.stringify(payload, null, 2));
    else console.log(`sync ${name}: nothing to sync -- this workflow's assets are read and run in place, and no doc gives them an install destination.`);
    return EXIT.OK;
  }

  const files = installer.plan(targets);
  const missing = files.filter((f) => f.status === 'missing-source');
  const todo = installer.pending(files);
  const results = opts.yes && todo.length ? installer.write(files) : null;
  const shown = results || files;

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          workflow: name,
          written: Boolean(results),
          targets: targets.map((t) => ({ key: t.key, label: t.label, authority: t.authority })),
          files: shown.map((f) => ({
            target: f.key,
            dest: short(f.dest),
            status: f.status,
            action: f.action || null,
            backup: f.backup ? short(f.backup) : null,
            verified: f.verified === undefined ? null : f.verified,
          })),
          pending: todo.length,
          failed: shown.filter((f) => f.verified === false).length + missing.length,
        },
        null,
        2
      )
    );
  } else {
    console.log(`SYNC ${name}${results ? '' : '  (preview -- nothing written)'}`);
    for (const t of targets) {
      const mine = shown.filter((f) => f.key === t.key);
      console.log(`  ${t.label}  [authority: ${t.authority}]`);
      for (const f of mine) console.log(installer.describe(f));
      if (!mine.length) console.log('    (no files)');
    }
    console.log('');
    if (missing.length) console.log(`${missing.length} source path(s) missing from the workflow.`);
    if (results) console.log(`Wrote ${results.filter((f) => f.action === 'created' || f.action === 'replaced').length} file(s); ${results.filter((f) => f.action === 'unchanged').length} already matched.`);
    else if (todo.length) console.log(`${todo.length} file(s) would change. Re-run with --yes to write them.`);
    else console.log('Everything already matches. Nothing to do.');
  }

  if (missing.length) return EXIT.PROBLEMS;
  if (results && results.some((f) => f.verified === false)) return EXIT.PROBLEMS;
  return EXIT.OK;
}

module.exports = { name: 'sync', summary, usage, run };
