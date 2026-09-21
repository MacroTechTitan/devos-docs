#!/usr/bin/env node
'use strict';
// devos -- DevOS CLI dispatcher. See cli/README.md and
// workflows/dev-environment/docs/devos-cli-plan.md.
//
// Exit codes: 0 ok, 1 problems found, 2 usage or unsupported platform.

const { EXIT, UsageError } = require('../src/lib/platform');

const COMMANDS = {
  doctor: require('../src/commands/doctor'),
  status: require('../src/commands/status'),
  run: require('../src/commands/run'),
};

// Contract verbs from the plan that are not built yet.
const PLANNED = {
  apply: 1,
  sync: 1,
  notify: 1,
  add: 2,
  friction: 2,
  sessions: 2,
  serve: 3,
};

const GLOBAL_FLAGS = {
  '--help': 'help',
  '-h': 'help',
  '--json': 'json',
  '--dry-run': 'dryRun',
  '--yes': 'yes',
  '--verbose': 'verbose',
};

function helpText() {
  const verbs = Object.values(COMMANDS)
    .map((c) => `  ${c.name.padEnd(9)} ${c.summary}`)
    .join('\n');
  const planned = Object.entries(PLANNED)
    .map(([v, phase]) => `  ${v.padEnd(9)} (phase ${phase}, not implemented)`)
    .join('\n');
  return `devos -- DevOS dev-environment CLI

Usage: devos <verb> [options]
       devos <verb> --help

Verbs:
${verbs}

Planned:
${planned}

Global options:
  --help, -h   Show help (for a verb: devos <verb> --help)
  --json       Machine-readable output on stdout
  --dry-run    Print what would run, run nothing
  --yes        Allow writes (no Phase 0 verb writes; accepted and ignored)
  --verbose    Name the wrapped script and shell on stderr

Exit codes: 0 ok, 1 problems found, 2 usage or unsupported platform.`;
}

// Global flags are recognized anywhere before the verb and, for most verbs,
// after it too. For passthrough verbs (run), everything after the verb is
// left untouched for the wrapped tool.
function parse(argv) {
  const opts = { help: false, json: false, dryRun: false, yes: false, verbose: false };
  let verb = null;
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (verb && COMMANDS[verb] && COMMANDS[verb].passthrough) {
      rest.push(a);
      continue;
    }
    if (a in GLOBAL_FLAGS) {
      opts[GLOBAL_FLAGS[a]] = true;
    } else if (!verb && !a.startsWith('-')) {
      verb = a;
    } else if (!verb) {
      throw new UsageError(`devos: unknown option '${a}'\n\n${helpText()}`);
    } else {
      rest.push(a);
    }
  }
  return { verb, rest, opts };
}

function main(argv) {
  const { verb, rest, opts } = parse(argv);

  if (!verb || verb === 'help') {
    if (verb === 'help' || opts.help) {
      console.log(helpText());
      return EXIT.OK;
    }
    console.error(helpText());
    return EXIT.USAGE;
  }

  if (verb in PLANNED) {
    throw new UsageError(`devos ${verb}: not implemented yet (planned for phase ${PLANNED[verb]}).`);
  }

  const cmd = COMMANDS[verb];
  if (!cmd) throw new UsageError(`devos: unknown verb '${verb}'\n\n${helpText()}`);

  if (opts.help && !cmd.passthrough) {
    console.log(cmd.usage);
    return EXIT.OK;
  }
  if (opts.help && cmd.passthrough && rest.length === 0) {
    console.log(cmd.usage);
    return EXIT.OK;
  }

  return cmd.run(rest, opts);
}

let code;
let jsonRequested = false;
try {
  jsonRequested = process.argv.slice(2).includes('--json');
  code = main(process.argv.slice(2));
} catch (err) {
  code = typeof err.exitCode === 'number' ? err.exitCode : EXIT.PROBLEMS;
  console.error(`${err.message}`);
  if (jsonRequested) console.log(JSON.stringify({ ok: false, exitCode: code, error: err.message.split('\n')[0] }));
}
process.exitCode = code;
