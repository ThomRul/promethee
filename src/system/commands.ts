import { spawn } from 'node:child_process';
import { access, open, realpath, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

export interface CommandRequest {
  command: string;
  args: readonly string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  stdio?: 'capture' | 'inherit';
}

export interface CommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
  error?: string;
  timedOut?: boolean;
}

export type CommandRunner = (request: CommandRequest) => Promise<CommandResult>;
export interface ResolveOptions {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  excludedDirectories?: readonly string[];
}
export type CommandResolver = (command: string) => Promise<string | undefined>;

function assertArgument(value: string): void {
  if (typeof value !== 'string' || /[\0\r\n]/u.test(value)) {
    throw new Error('Commande ou argument contenant un caractère de contrôle interdit.');
  }
}

function quoteBatchArgument(value: string): string {
  assertArgument(value);
  // CMD expands percent expressions even inside quotes. Refuse expansion and
  // embedded quotes rather than interpret a user path as another command.
  if (/[%!^"]/u.test(value)) {
    throw new Error(
      'CMD : les arguments contenant %, !, ^ ou un guillemet ne sont pas pris en charge.',
    );
  }
  return `"${value}"`;
}

export function commandInvocation(
  request: CommandRequest,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = request.env ?? process.env,
): { command: string; args: string[]; windowsVerbatimArguments: boolean } {
  assertArgument(request.command);
  request.args.forEach(assertArgument);
  if (platform !== 'win32' || !/\.(?:cmd|bat)$/iu.test(request.command)) {
    return { command: request.command, args: [...request.args], windowsVerbatimArguments: false };
  }
  const executable = path.win32.join(env.SystemRoot ?? 'C:\\Windows', 'System32', 'cmd.exe');
  const inner = [request.command, ...request.args].map(quoteBatchArgument).join(' ');
  return {
    command: executable,
    args: ['/d', '/s', '/v:off', '/c', `"${inner}"`],
    windowsVerbatimArguments: true,
  };
}

export const runCommand: CommandRunner = async (request) => {
  let invocation: ReturnType<typeof commandInvocation>;
  try {
    invocation = commandInvocation(request);
  } catch (error) {
    return { code: null, stdout: '', stderr: '', error: (error as Error).message };
  }
  return new Promise((resolve) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: request.cwd,
      env: request.env ?? process.env,
      shell: false,
      windowsHide: true,
      windowsVerbatimArguments: invocation.windowsVerbatimArguments,
      stdio: request.stdio === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '',
      stderr = '',
      timedOut = false,
      done = false;
    // Keep diagnostics bounded without blocking a command that writes a lot.
    const append = (text: string, chunk: Buffer) =>
      (text + chunk.toString('utf8')).slice(-1_048_576);
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout = append(stdout, chunk);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr = append(stderr, chunk);
    });
    const timer =
      request.timeoutMs === 0
        ? undefined
        : setTimeout(() => {
            timedOut = true;
            child.kill();
          }, request.timeoutMs ?? 30_000);
    const finish = (code: number | null, error?: string) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      resolve({
        code,
        stdout,
        stderr,
        ...(error ? { error } : {}),
        ...(timedOut ? { timedOut } : {}),
      });
    };
    child.once('error', (error) => finish(null, error.message));
    child.once('close', (code) =>
      finish(code, timedOut ? 'Commande interrompue : délai dépassé.' : undefined),
    );
  });
};

function inside(candidate: string, directory: string, platform: NodeJS.Platform): boolean {
  const normalise = (value: string) => (platform === 'win32' ? value.toLowerCase() : value);
  const pathApi = platform === 'win32' ? path.win32 : path.posix;
  const relative = pathApi.relative(normalise(directory), normalise(candidate));
  return (
    relative === '' ||
    (!relative.startsWith(`..${pathApi.sep}`) && relative !== '..' && !pathApi.isAbsolute(relative))
  );
}

async function isPortableExecutable(filename: string, size: number): Promise<boolean> {
  if (size < 68) return false;
  const handle = await open(filename, 'r');
  try {
    const header = Buffer.alloc(64);
    if (
      (await handle.read(header, 0, 64, 0)).bytesRead !== 64 ||
      header.toString('ascii', 0, 2) !== 'MZ'
    )
      return false;
    const offset = header.readUInt32LE(60);
    if (offset < 64 || offset > size - 4) return false;
    const signature = Buffer.alloc(4);
    return (
      (await handle.read(signature, 0, 4, offset)).bytesRead === 4 &&
      signature.equals(Buffer.from([0x50, 0x45, 0, 0]))
    );
  } finally {
    await handle.close();
  }
}

/** Resolve the ordinary PATH command, never process.execPath as a fallback. */
export async function resolveCommand(
  command: string,
  options: ResolveOptions = {},
): Promise<string | undefined> {
  assertArgument(command);
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const pathApi = platform === 'win32' ? path.win32 : path.posix;
  const envPath = Object.entries(env).find(([key]) => key.toLowerCase() === 'path')?.[1] ?? '';
  const directories = envPath.split(platform === 'win32' ? ';' : ':').filter(Boolean);
  const hasPath = command.includes('/') || command.includes('\\');
  const extensionless = !pathApi.extname(command);
  // npm ships both a POSIX shell file and npm.cmd in the same directory.
  // Windows named lookup must use its executable extensions, never that shell file.
  const extensions =
    platform === 'win32' && extensionless && !hasPath ? ['.exe', '.com', '.cmd', '.bat'] : [''];
  for (const directory of hasPath ? [''] : directories) {
    const cleanDirectory = directory.replace(/^"(.*)"$/u, '$1');
    for (const extension of extensions) {
      const candidate = pathApi.resolve(
        options.cwd ?? process.cwd(),
        cleanDirectory,
        command + extension,
      );
      try {
        const info = await stat(candidate);
        if (!info.isFile()) continue;
        await access(candidate, platform === 'win32' ? constants.F_OK : constants.X_OK);
        if (
          platform === 'win32' &&
          extensionless &&
          hasPath &&
          !(await isPortableExecutable(candidate, info.size))
        ) {
          throw new Error(
            'Un chemin Windows sans extension doit désigner un exécutable PE vérifié.',
          );
        }
        const canonical = await realpath(candidate);
        if (options.excludedDirectories?.some((excluded) => inside(canonical, excluded, platform)))
          continue;
        return canonical;
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) {
          throw new Error(`Commande inaccessible : ${candidate} (${(error as Error).message}).`);
        }
      }
    }
  }
  return undefined;
}
