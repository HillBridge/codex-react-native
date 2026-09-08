import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const [, , envName, command, ...rawArgs] = process.argv;

if (!envName || !command) {
  console.error('Usage: node scripts/run-with-env.mjs <env-name> <command> [...args]');
  process.exit(1);
}

const envPath = resolve(process.cwd(), `.env.${envName}`);
const args = command === 'expo' ? rawArgs.filter((arg) => arg !== '--') : rawArgs;
const envFileContents = readFileSync(envPath, 'utf8');
const shouldCreateExpoEnvOverride = command === 'expo' && args[0] === 'start';
const expoEnvOverridePath = resolve(process.cwd(), '.env.development.local');

if (shouldCreateExpoEnvOverride && existsSync(expoEnvOverridePath)) {
  console.error(`Refusing to overwrite existing ${expoEnvOverridePath}`);
  process.exit(1);
}

if (shouldCreateExpoEnvOverride) {
  writeFileSync(expoEnvOverridePath, envFileContents, { mode: 0o600 });
}

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

const envVars = parseEnvFile(envFileContents);
const child = spawn(command, args, {
  env: {
    ...process.env,
    ...envVars,
  },
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

function cleanupExpoEnvOverride() {
  if (shouldCreateExpoEnvOverride && existsSync(expoEnvOverridePath)) {
    unlinkSync(expoEnvOverridePath);
  }
}

child.on('error', (error) => {
  cleanupExpoEnvOverride();
  console.error(error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  cleanupExpoEnvOverride();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

process.on('exit', cleanupExpoEnvOverride);
