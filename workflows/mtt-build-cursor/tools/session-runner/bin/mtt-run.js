#!/usr/bin/env node
/**
 * mtt-run — run a Claude Code task unattended, surviving API errors.
 *
 * Usage (Git Bash, from the repo you want worked on):
 *   node /c/Dev/DevOS/workflows/mtt-build-cursor/tools/session-runner/bin/mtt-run.js <prompt-file> [options]
 *   mtt-run <prompt-file>                      (after install-runner.sh adds the alias)
 *
 * Options:
 *   --repo <path>      Repo to work in (default: cwd)
 *   --retries <n>      Retry attempts after a failure (default: 5)
 *   --fresh            Start a new session instead of --continue
 *   --model <name>     Pass through to claude
 *   --quiet            No desktop toast
 *   --dry-run          Print the commands, run nothing
 *
 * Exit codes: 0 completed, 1 gave up after retries, 2 bad usage.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const RETRYABLE = [
  /API Error/i, /Connection (lost|error|reset)/i, /ECONNRESET/i, /ETIMEDOUT/i,
  /socket hang up/i, /fetch failed/i, /rate.?limit/i, /overloaded/i,
  /502|503|504/, /Internal server error/i, /stream (ended|closed) unexpectedly/i
];

const RECOVERY_PREAMBLE = `The previous response was interrupted by a transport or API error. It was NOT cancelled and the task is NOT finished.

Recover state before doing anything else: run git status and git diff, and read the files they show as touched. The diff and the filesystem are authoritative — not any recap, summary, or prior narrative. Do not redo completed work, and do not restart the task from the beginning.

Continue from the first incomplete step, then finish the required gates (tests, typecheck, lint, build).

Original task follows.
---
`;

function parseArgs(argv) {
  const o = { retries: 5, repo: process.cwd(), fresh: false, quiet: false, dryRun: false, model: null, promptFile: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--repo") o.repo = argv[++i];
    else if (a === "--retries") o.retries = parseInt(argv[++i], 10);
    else if (a === "--model") o.model = argv[++i];
    else if (a === "--fresh") o.fresh = true;
    else if (a === "--quiet") o.quiet = true;
    else if (a === "--dry-run") o.dryRun = true;
    else if (a === "-h" || a === "--help") o.help = true;
    else if (!o.promptFile) o.promptFile = a;
  }
  return o;
}

function toast(title, message, quiet) {
  if (quiet || os.platform() !== "win32") return;
  const ps = `
[void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')
$n = New-Object System.Windows.Forms.NotifyIcon
$n.Icon = [System.Drawing.SystemIcons]::Information
$n.Visible = $true
$n.ShowBalloonTip(10000, ${JSON.stringify(title)}, ${JSON.stringify(message)}, 'Info')
Start-Sleep -Seconds 6
$n.Dispose()`;
  try {
    spawn("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", ps], {
      detached: true, stdio: "ignore", windowsHide: true
    }).unref();
  } catch { /* notifications are best-effort */ }
}

function runAttempt(prompt, opts, logStream) {
  return new Promise(resolve => {
    const args = ["-p", prompt, "--dangerously-skip-permissions"];
    if (!opts.fresh) args.push("--continue");
    if (opts.model) args.push("--model", opts.model);

    if (opts.dryRun) {
      console.log("[dry-run] claude " + args.map(a => (a.length > 60 ? a.slice(0, 60) + "…" : a)).join(" "));
      return resolve({ code: 0, output: "" });
    }

    const child = spawn("claude", args, { cwd: opts.repo, shell: true });
    let output = "";
    const capture = chunk => {
      const s = chunk.toString();
      output += s;
      process.stdout.write(s);
      logStream.write(s);
    };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    child.on("error", err => resolve({ code: 127, output: output + "\nspawn error: " + err.message }));
    child.on("close", code => resolve({ code, output }));
  });
}

function isRetryable(result) {
  if (result.code === 0) return false;
  const tail = result.output.slice(-4000);
  return RETRYABLE.some(re => re.test(tail)) || result.code !== 0;
}

(async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.promptFile) {
    console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace("/**", ""));
    process.exit(opts.help ? 0 : 2);
  }
  if (!fs.existsSync(opts.promptFile)) {
    console.error("Prompt file not found: " + opts.promptFile);
    process.exit(2);
  }
  if (!fs.existsSync(opts.repo)) {
    console.error("Repo not found: " + opts.repo);
    process.exit(2);
  }

  const task = fs.readFileSync(opts.promptFile, "utf8").trim();
  const repoName = path.basename(path.resolve(opts.repo));
  const logDir = path.join(opts.repo, ".mtt-run");
  fs.mkdirSync(logDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, stamp + "-" + path.basename(opts.promptFile, ".md") + ".log");
  const log = fs.createWriteStream(logPath, { flags: "a" });

  console.log(`mtt-run: ${repoName} | prompt ${path.basename(opts.promptFile)} | retries ${opts.retries}`);
  console.log(`log: ${logPath}\n`);

  let attempt = 0;
  while (attempt <= opts.retries) {
    const prompt = attempt === 0 ? task : RECOVERY_PREAMBLE + task;
    const label = attempt === 0 ? "attempt 1" : `retry ${attempt}/${opts.retries}`;
    log.write(`\n===== ${label} @ ${new Date().toISOString()} =====\n`);
    console.log(`\n--- ${label} ---`);

    const result = await runAttempt(prompt, { ...opts, fresh: opts.fresh && attempt === 0 }, log);

    if (result.code === 0) {
      log.end(`\n===== completed @ ${new Date().toISOString()} =====\n`);
      toast(`${repoName}: done`, `Task finished after ${attempt + 1} attempt(s).`, opts.quiet);
      console.log(`\nmtt-run: completed after ${attempt + 1} attempt(s).`);
      process.exit(0);
    }

    if (!isRetryable(result) || attempt === opts.retries) break;

    attempt++;
    const waitMs = Math.min(60000, 5000 * Math.pow(2, attempt - 1));
    console.log(`\nmtt-run: failed (exit ${result.code}). Retrying in ${waitMs / 1000}s with recovery preamble.`);
    log.write(`\n--- retrying in ${waitMs}ms (exit ${result.code}) ---\n`);
    await new Promise(r => setTimeout(r, waitMs));
  }

  log.end(`\n===== gave up @ ${new Date().toISOString()} =====\n`);
  toast(`${repoName}: needs you`, `mtt-run gave up after ${attempt + 1} attempt(s). See .mtt-run log.`, opts.quiet);
  console.error(`\nmtt-run: gave up. Log: ${logPath}`);
  process.exit(1);
})();
