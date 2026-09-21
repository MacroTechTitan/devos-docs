'use strict';
// devos status -- wraps workflows/dev-environment/scripts/repo-status.ps1 -Json.
const { requireScript } = require('../lib/paths');
const { EXIT, UsageError, assertWindows, findPowerShell, psArgs, runPsJson, toArray, describeCommand } = require('../lib/platform');

const summary = 'Repos, branches, dirty, ahead/behind, idle days; exit 1 if attention needed';
const usage = `Usage: devos status [--root <dir>] [--depth <n>] [--json] [--dry-run] [--verbose]

Runs repo-status.ps1 -Json (pwsh, else powershell.exe) over every git repo
under --root (default C:\\Dev), searching --depth levels (default 3). Read-only:
never fetches, so ahead/behind is against the last fetch.

Exit: 0 all clean and pushed, 1 any repo dirty or unpushed, 2 usage or unsupported platform.`;

function parse(args) {
  const scriptArgs = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--root' || a === '--depth') {
      const v = args[++i];
      if (v === undefined) throw new UsageError(`devos status: ${a} needs a value\n\n${usage}`);
      if (a === '--depth' && !/^\d+$/.test(v)) throw new UsageError(`devos status: --depth must be a whole number\n\n${usage}`);
      scriptArgs.push(a === '--root' ? '-Root' : '-Depth', v);
    } else {
      throw new UsageError(`devos status: unexpected argument '${a}'\n\n${usage}`);
    }
  }
  return scriptArgs;
}

function printTable(data, rows, needs) {
  const cols = ['Repo', 'Branch', 'Dirty', 'Ahead', 'Behind', 'DaysIdle'];
  const cells = rows.map((r) => cols.map((c) => (r[c] === null || r[c] === undefined ? '-' : String(r[c]))));
  const widths = cols.map((c, i) => Math.max(c.length, ...cells.map((row) => row[i].length)));
  const line = (vals) => vals.map((v, i) => v.padEnd(widths[i])).join('  ');
  const out = [`REPO STATUS -- ${data.root || ''}`, ''];
  if (rows.length) {
    out.push(line(cols), line(widths.map((w) => '-'.repeat(w))));
    for (const row of cells) out.push(line(row));
  } else {
    out.push('no git repos found');
  }
  out.push('');
  if (needs.length) {
    out.push(`NEEDS ATTENTION (${needs.length})`);
    for (const n of needs) out.push(`  ${n}`);
  } else {
    out.push('All repos clean and pushed.');
  }
  console.log(out.join('\n'));
}

function run(args, opts) {
  const scriptArgs = parse(args);
  assertWindows('status');
  const script = requireScript('repoStatus');
  const shell = findPowerShell();
  const fullArgs = [...scriptArgs, '-Json'];
  const cmd = describeCommand(shell.exe, psArgs(script, fullArgs));

  if (opts.verbose) console.error(`[devos] wraps: ${cmd}\n[devos] shell: ${shell.exe} ${shell.version}`);
  if (opts.dryRun) {
    console.log(opts.json ? JSON.stringify({ dryRun: true, command: cmd }) : `dry-run: would run\n  ${cmd}`);
    return EXIT.OK;
  }

  const data = runPsJson(script, fullArgs);
  const rows = toArray(data.rows);
  const needs = toArray(data.needsAttention).map(String);
  data.rows = rows;
  data.needsAttention = needs;

  if (opts.json) console.log(JSON.stringify(data, null, 2));
  else printTable(data, rows, needs);

  return needs.length ? EXIT.PROBLEMS : EXIT.OK;
}

module.exports = { name: 'status', summary, usage, run };
