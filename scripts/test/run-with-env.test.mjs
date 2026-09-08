import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const runnerPath = join(scriptsDirectory, '..', 'run-with-env.mjs');

test('sandbox Expo startup applies its environment as the highest-priority local override', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'run-with-env-'));
  const binDirectory = join(directory, 'bin');
  const expoPath = join(binDirectory, 'expo');
  const overlayPath = join(directory, '.env.development.local');

  try {
    await mkdir(binDirectory);
    await writeFile(
      join(directory, '.env.sandbox'),
      'EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:4006\n',
    );
    await writeFile(
      expoPath,
      '#!/usr/bin/env node\nconst fs = require("node:fs");\nconst value = fs.readFileSync(".env.development.local", "utf8");\nprocess.stdout.write(JSON.stringify({ args: process.argv.slice(2), value }));\n',
    );
    await chmod(expoPath, 0o755);

    const { stdout } = await execFile(
      process.execPath,
      [runnerPath, 'sandbox', 'expo', 'start', '--', '--port', '8082'],
      {
        cwd: directory,
        env: { ...process.env, PATH: `${binDirectory}:${process.env.PATH}` },
      },
    );

    assert.deepEqual(JSON.parse(stdout), {
      args: ['start', '--port', '8082'],
      value: 'EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:4006\n',
    });
    await assert.rejects(readFile(overlayPath, 'utf8'), { code: 'ENOENT' });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
