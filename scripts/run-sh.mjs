// Run a POSIX shell script portably: Git Bash on Windows (a bare `bash` there is often the WSL launcher),
// plain bash elsewhere. Usage: node scripts/run-sh.mjs verify.sh [args...]   (SABOOT_BASH overrides)
import { spawnSync, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

function findBash() {
  if (process.platform !== 'win32') return 'bash';
  const c = [process.env.SABOOT_BASH, 'C:/Program Files/Git/bin/bash.exe', 'C:/Program Files (x86)/Git/bin/bash.exe'];
  try {
    const git = execSync('where git', { encoding: 'utf8' }).split(/\r?\n/)[0].trim();
    c.push(join(dirname(dirname(git)), 'bin', 'bash.exe'));
  } catch { /* git not on PATH */ }
  return c.find((p) => p && existsSync(p)) ?? 'bash';
}

const [script, ...args] = process.argv.slice(2);
const r = spawnSync(findBash(), [script, ...args], { stdio: 'inherit' });
process.exit(r.status ?? 1);
