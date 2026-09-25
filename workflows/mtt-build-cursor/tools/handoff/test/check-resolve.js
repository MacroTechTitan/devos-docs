// Check repo-name resolution. Usage: node check-resolve.js <dir>=<expected> ...
// Exits 1 if any directory resolves to a different name.
const { resolveRepo } = require('../write-handoff.js');

let fail = 0;
for (const arg of process.argv.slice(2)) {
  const i = arg.lastIndexOf('=');
  const dir = arg.slice(0, i);
  const want = arg.slice(i + 1);
  const got = resolveRepo(dir);
  const ok = got.repo === want;
  if (!ok) fail = 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${dir} -> ${got.repo} (want ${want}) main=${got.mainRoot} worktree=${got.worktree}`);
}
process.exit(fail);
