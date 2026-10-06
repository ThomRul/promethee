import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { commandInvocation, resolveCommand, runCommand } from '../src/system/commands.js';

test('real commands preserve argv values without a shell', async () => {
  const values = ['two words', 'x & y', '$(echo bad)', 'quote"value', 'x;echo bad'];
  const result = await runCommand({
    command: process.execPath,
    args: ['-e', 'process.stdout.write(JSON.stringify(process.argv.slice(1)))', ...values],
  });
  assert.equal(result.code, 0);
  assert.deepEqual(JSON.parse(result.stdout), values);
});

test('CMD wraps paths and arguments, disables delayed expansion and rejects expansion/quotes', () => {
  const invocation = commandInvocation(
    { command: 'C:\\Tools & kits (x)\\npm.cmd', args: ['install', 'C:\\A & B'] },
    'win32',
    { SystemRoot: 'C:\\Windows' },
  );
  assert.deepEqual(invocation.args, [
    '/d',
    '/s',
    '/v:off',
    '/c',
    '""C:\\Tools & kits (x)\\npm.cmd" "install" "C:\\A & B""',
  ]);
  assert.equal(invocation.windowsVerbatimArguments, true);
  for (const value of ['%PATH%', '!X!', '^&calc', 'x" & calc', 'x\ncalc']) {
    assert.throws(() =>
      commandInvocation({ command: 'C:\\Tools\\npm.cmd', args: [value] }, 'win32'),
    );
  }
});

test('PATH resolution excludes a bundled runtime and does not fall back to process.execPath', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'promethee-path-'));
  try {
    const privateDirectory = path.join(directory, 'private runtime');
    const ordinary = path.join(directory, 'ordinary');
    await mkdir(privateDirectory);
    await mkdir(ordinary);
    const filename = process.platform === 'win32' ? 'node.exe' : 'node';
    await writeFile(path.join(privateDirectory, filename), '', { mode: 0o755 });
    await writeFile(path.join(ordinary, filename), '', { mode: 0o755 });
    const result = await resolveCommand('node', {
      env: { PATH: [privateDirectory, ordinary].join(path.delimiter) },
      excludedDirectories: [privateDirectory],
    });
    assert.equal(result, path.join(ordinary, filename));
    assert.equal(await resolveCommand('node', { env: { PATH: '' } }), undefined);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test(
  'Windows batch arguments cannot turn an ampersand path into a second command',
  { skip: process.platform !== 'win32' },
  async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'promethee-batch-'));
    try {
      const command = path.join(directory, 'check & spaces.cmd');
      await writeFile(command, '@echo off\r\necho %1\r\n');
      const result = await runCommand({
        command,
        args: ['ok & echo injected > bad.txt'],
        cwd: directory,
      });
      assert.equal(result.code, 0);
      assert.match(result.stdout, /ok & echo injected > bad\.txt/u);
      await assert.rejects(readFile(path.join(directory, 'bad.txt')), { code: 'ENOENT' });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);

test(
  'Windows npm lookup ignores its extensionless POSIX script and selects npm.cmd',
  { skip: process.platform !== 'win32' },
  async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'promethee-npm-lookup-'));
    try {
      await writeFile(path.join(directory, 'npm'), '#!/bin/sh\nprintf wrong');
      await writeFile(path.join(directory, 'npm.cmd'), '@echo off\r\necho 11.8.0\r\n');
      const command = await resolveCommand('npm', { platform: 'win32', env: { PATH: directory } });
      assert.equal(command, path.join(directory, 'npm.cmd'));
      const result = await runCommand({ command: command!, args: ['--version'] });
      assert.equal(result.code, 0);
      assert.equal(result.stdout.trim(), '11.8.0');
      await assert.rejects(
        resolveCommand(path.join(directory, 'npm'), { platform: 'win32' }),
        /exécutable PE/u,
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
