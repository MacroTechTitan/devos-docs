#!/usr/bin/env node
// Idempotent merge of the MTT baseline into %USERPROFILE%\.claude\settings.json.
// Usage: node scripts/apply-settings.js   (add --dry-run to preview)
const fs = require("fs");
const path = require("path");
const home = process.env.USERPROFILE || process.env.HOME;
const p = path.join(home, ".claude", "settings.json");
const dry = process.argv.includes("--dry-run");

const DENY = [
  "Bash(git push --force*)", "Bash(git push -f*)", "Bash(git push * +*)",
  "Bash(git reset --hard *)", "Bash(git clean -f*)", "Bash(rm -rf *)",
  "Bash(rmdir /s*)", "Bash(gh repo delete *)", "Bash(gh api -X DELETE *)",
  "Bash(supabase projects delete *)", "Bash(supabase db reset *)",
  "Bash(vercel remove *)", "Bash(vercel env rm *)", "Bash(docker system prune *)",
  "Bash(dropdb *)", "Bash(psql * -c DROP*)", "Bash(curl * -T *)",
  "Bash(curl * --upload-file *)", "PowerShell(Remove-Item *)",
  "PowerShell(git push --force*)", "PowerShell(git push -f*)"
];

const s = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
s.permissions = s.permissions || {};
s.permissions.defaultMode = "bypassPermissions";
s.permissions.blockReadsOutsideWorkingDirectories = false;
s.permissions.deny = [...new Set([...(s.permissions.deny || []), ...DENY])];
s.skipDangerousModePermissionPrompt = true;

if (dry) { console.log(JSON.stringify(s.permissions, null, 2)); process.exit(0); }
if (fs.existsSync(p)) fs.copyFileSync(p, p + ".bak-" + Date.now());
fs.mkdirSync(path.dirname(p), { recursive: true });
fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");

const c = JSON.parse(fs.readFileSync(p, "utf8")).permissions;
console.log("defaultMode:", c.defaultMode);
console.log("blockReadsOutsideWorkingDirectories:", c.blockReadsOutsideWorkingDirectories);
console.log("deny (" + c.deny.length + "):");
c.deny.forEach(d => console.log("  " + d));
console.log("Relaunch Claude Code windows: claude --dangerously-skip-permissions --continue");
