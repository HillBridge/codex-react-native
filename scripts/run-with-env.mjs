import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const [, , envName, command, ...args] = process.argv;

if (!envName || !command) {
  console.error('Usage: node scripts/run-with-env.mjs <env-name> <command> [...args]');
  process.exit(1);
}

const envPath = resolve(process.cwd(), `.env.${envName}`);

function parseEnvFile(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        const key = line.slice(0, separatorIndex).trim();
        const rawValue = line.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^['"]|['"]$/g, '');

        return [key, value];
      }),
  );
}

const envVars = parseEnvFile(readFileSync(envPath, 'utf8'));
const child = spawn(command, args, {
  env: {
    ...process.env,
    ...envVars,
  },
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
