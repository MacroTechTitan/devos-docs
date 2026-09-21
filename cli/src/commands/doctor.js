'use strict';
// devos doctor -- wraps workflows/dev-environment/scripts/sysinfo.ps1 -Json.
const { requireScript } = require('../lib/paths');
const { EXIT, UsageError, assertWindows, findPowerShell, psArgs, runPsJson, toArray, describeCommand } = require('../lib/platform');

const summary = 'System report plus FLAGS; exit 1 if any flag fires';
const usage = `Usage: devos doctor [--json] [--dry-run] [--verbose]

Runs sysinfo.ps1 -Json (pwsh, else powershell.exe), prints a report and the
FLAGS summary. Read-only.

Exit: 0 no flags, 1 one or more flags fired, 2 usage or unsupported platform.`;

function fmt(v, fallback = '-') {
  return v === null || v === undefined || v === '' ? fallback : String(v);
}

function printReport(d, flags) {
  const os = d.os || {};
  const hw = d.hardware || {};
  const ai = d.ai || {};
  const out = [];
  out.push('DEVOS DOCTOR');
  out.push('='.repeat(62));
  out.push('SYSTEM');
  out.push(`  ${fmt(os.machine)} (${fmt(os.user)})  ${fmt(os.caption)} ${fmt(os.build)}`);
  out.push(`  up ${fmt(os.uptimeHours)} h   ${fmt(os.locale)}   ${fmt(os.timezone)}`);
  out.push('HARDWARE');
  out.push(`  ${fmt(hw.cpu)}  ${fmt(hw.cores)}c/${fmt(hw.threads)}t`);
  out.push(`  RAM ${fmt(hw.ramTotalGB)} GB, ${fmt(hw.ramFreeGB)} GB free (${fmt(hw.ramUsedPct)}% used)`);
  out.push('DISKS');
  for (const disk of toArray(d.disks)) {
    out.push(`  ${fmt(disk.drive)}  ${fmt(disk.freeGB)} GB free of ${fmt(disk.totalGB)} GB (${fmt(disk.freePct)}% free)`);
  }
  out.push('TOOLCHAIN');
  for (const [name, t] of Object.entries(d.tools || {})) {
    out.push(`  ${name.padEnd(9)} ${t && t.installed ? fmt(t.version) : 'NOT INSTALLED'}`);
  }
  out.push('AI LAYER');
  if (ai.exists) {
    out.push(`  mode=${fmt(ai.defaultMode)}  allow=${fmt(ai.allowRules)}  deny=${fmt(ai.denyRules)}  blockReads=${fmt(ai.blockReads)}`);
  } else {
    out.push('  ~/.claude/settings.json MISSING');
  }
  const ports = toArray(d.ports);
  out.push('DEV PORTS IN USE');
  if (ports.length) for (const p of ports) out.push(`  ${String(p.port).padEnd(6)} ${fmt(p.process)} (pid ${fmt(p.pid)})`);
  else out.push('  none');
  out.push('');
  out.push(`FLAGS (${flags.length})`);
  if (flags.length) for (const f of flags) out.push(`  ! ${f}`);
  else out.push('  none');
  console.log(out.join('\n'));
}

function run(args, opts) {
  if (args.length) throw new UsageError(`devos doctor: unexpected argument '${args[0]}'\n\n${usage}`);
  assertWindows('doctor');
  const script = requireScript('sysinfo');
  const shell = findPowerShell();
  const cmd = describeCommand(shell.exe, psArgs(script, ['-Json']));

  if (opts.verbose) console.error(`[devos] wraps: ${cmd}\n[devos] shell: ${shell.exe} ${shell.version}`);
  if (opts.dryRun) {
    console.log(opts.json ? JSON.stringify({ dryRun: true, command: cmd }) : `dry-run: would run\n  ${cmd}`);
    return EXIT.OK;
  }

  const data = runPsJson(script, ['-Json']);
  const flags = toArray(data.flags).map(String);
  data.flags = flags;

  if (opts.json) console.log(JSON.stringify(data, null, 2));
  else printReport(data, flags);

  return flags.length ? EXIT.PROBLEMS : EXIT.OK;
}

module.exports = { name: 'doctor', summary, usage, run };
