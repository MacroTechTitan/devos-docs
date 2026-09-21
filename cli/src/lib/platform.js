'use strict';
// Platform gate and PowerShell detection. Everything Windows-specific sits here.
const { spawnSync } = require('child_process');

const EXIT = { OK: 0, PROBLEMS: 1, USAGE: 2 };

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.exitCode = EXIT.USAGE;
  }
}

// Phase 0 verbs wrap PowerShell scripts, so they need Windows.
function assertWindows(verb) {
  if (process.platform !== 'win32') {
    throw new UsageError(
      `devos ${verb}: unsupported platform '${process.platform}'. ` +
        'Phase 0 verbs wrap Windows PowerShell scripts and run on Windows only.'
    );
  }
}

let cachedShell;

// Prefer pwsh 7; fall back to Windows PowerShell 5.1. The .ps1 files are
// ASCII-only with a UTF-8 BOM so they parse under either.
function findPowerShell() {
  if (cachedShell) return cachedShell;
  for (const exe of ['pwsh', 'powershell']) {
    const r = spawnSync(exe, ['-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.ToString()'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30000,
    });
    if (!r.error && r.status === 0) {
      cachedShell = { exe, version: r.stdout.trim() };
      return cachedShell;
    }
  }
  const err = new Error('Neither pwsh nor powershell.exe could be started.');
  err.exitCode = EXIT.PROBLEMS;
  throw err;
}

function psArgs(scriptPath, scriptArgs = []) {
  return ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...scriptArgs];
}

// Run a .ps1 and parse its JSON stdout.
function runPsJson(scriptPath, scriptArgs = []) {
  const shell = findPowerShell();
  const r = spawnSync(shell.exe, psArgs(scriptPath, scriptArgs), {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
    timeout: 10 * 60 * 1000,
  });
  if (r.error) {
    const err = new Error(`failed to run ${shell.exe}: ${r.error.message}`);
    err.exitCode = EXIT.PROBLEMS;
    throw err;
  }
  if (r.status !== 0) {
    const err = new Error(`${scriptPath} exited ${r.status}\n${(r.stderr || '').trim()}`);
    err.exitCode = EXIT.PROBLEMS;
    throw err;
  }
  const text = (r.stdout || '').replace(/^﻿/, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    const err = new Error(`${scriptPath} did not return JSON: ${e.message}\n${text.slice(0, 400)}`);
    err.exitCode = EXIT.PROBLEMS;
    throw err;
  }
}

// Windows PowerShell 5.1 can serialize arrays as {"value": [...], "Count": n},
// and collapses single-item arrays to the item. Normalize both to a plain array.
function toArray(v) {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object' && Array.isArray(v.value) && 'Count' in v) return v.value;
  return [v];
}

// Render a command line for --dry-run and --verbose output.
function describeCommand(exe, args) {
  return [exe, ...args].map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)).join(' ');
}

module.exports = { EXIT, UsageError, assertWindows, findPowerShell, psArgs, runPsJson, toArray, describeCommand };
