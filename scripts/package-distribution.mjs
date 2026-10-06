import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { safeResourcePath, verifyResources, walkFiles } from './verify-resources.mjs';

const execute = promisify(execFile);
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const resourceDirs = ['catalogue', 'templates', 'branding', 'validation'];
const resourceDocs = [
  'SPECIFICATION.md',
  'BOOTSTRAP.md',
  'NAVIGATION.md',
  'SERVICES.md',
  'VERSIONS.md',
  'A-TERMINER.md',
  'PREPARATION-V0.2.md',
  'CHANGES.md',
  'VERSION.json',
  'promethee-main-feu.png',
];
const pythonProgram = String.raw`
import gzip, hashlib, json, pathlib, sys, tarfile, zipfile
mode, request_path = sys.argv[1:]
r = json.loads(pathlib.Path(request_path).read_text(encoding='utf-8'))
if mode == 'runtime':
    archive, root = pathlib.Path(r['archive']), r['archiveRoot']
    names = [('node.exe' if r['platform'] == 'windows' else 'bin/node', r['executable']), ('LICENSE', r['license'])]
    if r['platform'] == 'windows':
        with zipfile.ZipFile(archive) as source:
            for relative, local in names:
                if source.read(root + '/' + relative) != pathlib.Path(local).read_bytes():
                    raise ValueError('Runtime extracted bytes mismatch: ' + relative)
    else:
        with tarfile.open(archive, 'r:xz') as source:
            for relative, local in names:
                member = source.getmember(root + '/' + relative)
                if not member.isfile() or source.extractfile(member).read() != pathlib.Path(local).read_bytes():
                    raise ValueError('Runtime extracted bytes mismatch: ' + relative)
    print(json.dumps({'archiveBytesMatched': True}))
else:
    staging, archive, top, epoch = pathlib.Path(r['staging']), pathlib.Path(r['output']), r['top'], r['epoch']
    files = sorted(p for p in staging.rglob('*') if p.is_file())
    if r['platform'] == 'windows':
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as target:
            for file in files:
                relative = file.relative_to(staging).as_posix()
                info = zipfile.ZipInfo(top + '/' + relative, (2026, 10, 6, 0, 0, 0))
                info.create_system, info.external_attr = 3, 0o100644 << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                target.writestr(info, file.read_bytes(), compresslevel=9)
        with zipfile.ZipFile(archive) as check:
            if check.testzip() is not None: raise ValueError('Archive CRC mismatch')
            for file in files:
                if check.read(top + '/' + file.relative_to(staging).as_posix()) != file.read_bytes():
                    raise ValueError('Archive byte mismatch')
    else:
        with archive.open('wb') as raw, gzip.GzipFile(filename='', mode='wb', fileobj=raw, mtime=epoch) as gz:
            with tarfile.open(fileobj=gz, mode='w', format=tarfile.PAX_FORMAT) as target:
                for file in files:
                    relative = file.relative_to(staging).as_posix()
                    info = tarfile.TarInfo(top + '/' + relative)
                    info.size, info.mtime, info.uid, info.gid = file.stat().st_size, epoch, 0, 0
                    info.mode = 0o755 if relative in ['promethee', 'runtime/bin/node'] else 0o644
                    with file.open('rb') as stream: target.addfile(info, stream)
        with tarfile.open(archive, 'r:gz') as check:
            for file in files:
                member = check.getmember(top + '/' + file.relative_to(staging).as_posix())
                if not member.isfile() or check.extractfile(member).read() != file.read_bytes():
                    raise ValueError('Archive byte mismatch')
    print(json.dumps({'files': len(files), 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest()}))
`;

export async function validateRuntime({
  platform,
  runtimeDir,
  runtimeVersion,
  referenceVersion,
  development = false,
}) {
  if (!['windows', 'ubuntu'].includes(platform))
    throw new Error('Platform must be windows or ubuntu');
  if (!runtimeDir)
    throw new Error('Explicit --runtime-dir required; project Node must not be substituted');
  if (!/^24\.\d+\.\d+$/.test(runtimeVersion ?? ''))
    throw new Error('Explicit Node 24 runtime version required');
  if (!development && runtimeVersion !== referenceVersion)
    throw new Error(`Runtime must match pinned reference ${referenceVersion}`);
  const root = path.resolve(runtimeDir);
  const relative = platform === 'windows' ? 'node.exe' : 'bin/node';
  const executable = safeResourcePath(root, relative);
  const license = safeResourcePath(root, 'LICENSE');
  for (const file of [executable, license]) {
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw new Error(`Runtime regular file required: ${file}`);
  }
  const bytes = await fs.readFile(executable);
  if (platform === 'windows') {
    const pe = bytes.length >= 64 ? bytes.readUInt32LE(60) : -1;
    if (
      bytes.subarray(0, 2).toString() !== 'MZ' ||
      pe < 0 ||
      pe + 6 > bytes.length ||
      bytes.subarray(pe, pe + 4).toString() !== 'PE\0\0' ||
      bytes.readUInt16LE(pe + 4) !== 0x8664
    ) {
      throw new Error('Windows x64 PE Node executable required');
    }
  } else if (
    bytes.length < 20 ||
    !bytes.subarray(0, 4).equals(Buffer.from([127, 69, 76, 70])) ||
    bytes[4] !== 2 ||
    bytes[5] !== 1 ||
    bytes.readUInt16LE(18) !== 62
  ) {
    throw new Error('Ubuntu x64 ELF Node executable required');
  }
  const licenseText = await fs.readFile(license, 'utf8');
  if (
    licenseText.length < 1000 ||
    !/Permission is hereby granted/.test(licenseText) ||
    !/Node/.test(licenseText)
  ) {
    throw new Error('Complete matching Node distribution LICENSE required');
  }
  let execution = 'not-executed-cross-platform';
  if (
    (platform === 'windows' && process.platform === 'win32') ||
    (platform === 'ubuntu' && process.platform === 'linux')
  ) {
    const { stdout } = await execute(
      executable,
      [
        '-p',
        'JSON.stringify({version:process.versions.node,arch:process.arch,platform:process.platform})',
      ],
      { timeout: 10000, windowsHide: true },
    );
    const result = JSON.parse(stdout);
    if (
      result.version !== runtimeVersion ||
      result.arch !== 'x64' ||
      result.platform !== (platform === 'windows' ? 'win32' : 'linux')
    ) {
      throw new Error('Node runtime version/platform mismatch');
    }
    execution = 'version-command-passed';
  }
  return { executable, license, relative, version: runtimeVersion, sha256: hash(bytes), execution };
}

async function copyDirectory(source, destination, { excludeNodeModules = false } = {}) {
  for (const relative of await walkFiles(source)) {
    if (excludeNodeModules && relative.split('/').includes('node_modules')) continue;
    const target = safeResourcePath(destination, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(safeResourcePath(source, relative), target);
  }
}

async function copyProductionDependencies(root, staging, pkg) {
  const visited = new Set();
  async function findPackage(name, origin) {
    if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(name))
      throw new Error(`Unsupported dependency name: ${name}`);
    let current = origin;
    while (current.startsWith(root + path.sep) || current === root) {
      const candidate = path.join(current, 'node_modules', ...name.split('/'));
      try {
        await fs.access(path.join(candidate, 'package.json'));
        return candidate;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
    throw new Error(`Missing installed production dependency: ${name}`);
  }
  async function copy(name, origin) {
    const dir = await findPackage(name, origin);
    if (visited.has(dir)) return;
    visited.add(dir);
    const manifest = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8'));
    const files = await walkFiles(dir);
    if (!files.some((file) => /^(?:LICENSE|LICENCE|COPYING)(?:\.|$)/i.test(file)))
      throw new Error(`Dependency license missing: ${name}`);
    await copyDirectory(dir, path.join(staging, path.relative(root, dir)), {
      excludeNodeModules: true,
    });
    for (const dep of Object.keys(manifest.dependencies ?? {}).sort()) await copy(dep, dir);
    for (const dep of Object.keys(manifest.peerDependencies ?? {}).sort()) {
      if (!manifest.peerDependenciesMeta?.[dep]?.optional) await copy(dep, dir);
    }
    if (Object.keys(manifest.optionalDependencies ?? {}).length)
      throw new Error(`Optional dependency packaging requires qualification: ${name}`);
  }
  for (const name of Object.keys(pkg.dependencies ?? {}).sort()) await copy(name, root);
  return visited.size;
}

export async function packageDistribution(options) {
  const root = path.resolve(
    options.root ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  );
  const report = await verifyResources(root);
  if (!report.passed)
    throw new Error(`Resources failed verification:\n${report.errors.join('\n')}`);
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const frameworks = JSON.parse(
    await fs.readFile(path.join(root, 'catalogue/frameworks.lock.json'), 'utf8'),
  );
  const runtime = await validateRuntime({ ...options, referenceVersion: frameworks.cli.node });
  if (!options.development && !options.runtimeArchive)
    throw new Error('Checksummed official --runtime-archive required for distribution');
  if (runtime.execution.startsWith('not-executed') && !options.runtimeArchive)
    throw new Error('Cross-platform runtime requires matching official archive proof');
  const python = options.python ?? process.env.PROMETHEE_PACKAGING_PYTHON ?? 'python';
  const outputDir = path.resolve(root, options.outputDir ?? 'releases');
  const suffix = options.development ? '-development' : '-preview';
  const top = `promethee-${pkg.version}-${options.platform}-x64${suffix}`;
  const output = path.join(
    outputDir,
    `${top}${options.platform === 'windows' ? '.zip' : '.tar.gz'}`,
  );
  try {
    await fs.access(output);
    if (!options.overwrite) throw new Error(`Archive exists; use --overwrite: ${output}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'promethee-package-'));
  const staging = path.join(temp, 'staging');
  try {
    await fs.mkdir(staging);
    async function pythonCall(mode, data) {
      const request = path.join(temp, `request-${mode}.json`);
      await fs.writeFile(request, JSON.stringify(data));
      const { stdout } = await execute(python, ['-c', pythonProgram, mode, request], {
        timeout: 120000,
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      });
      return JSON.parse(stdout);
    }
    let archiveProof = null;
    if (options.runtimeArchive) {
      if (!/^[a-f0-9]{64}$/.test(options.runtimeArchiveSha256 ?? ''))
        throw new Error('Official archive SHA256 required');
      const archive = path.resolve(options.runtimeArchive);
      const archiveRoot = `node-v${runtime.version}-${options.platform === 'windows' ? 'win' : 'linux'}-x64`;
      if (
        path.basename(archive) !==
        `${archiveRoot}${options.platform === 'windows' ? '.zip' : '.tar.xz'}`
      )
        throw new Error('Runtime archive name/version/platform mismatch');
      if (hash(await fs.readFile(archive)) !== options.runtimeArchiveSha256)
        throw new Error('Runtime archive SHA256 mismatch');
      archiveProof = await pythonCall('runtime', {
        archive,
        archiveRoot,
        platform: options.platform,
        executable: runtime.executable,
        license: runtime.license,
      });
    }
    const build = path.resolve(root, options.buildDir ?? 'dist/src');
    const entry = options.entry ?? 'main.js';
    if (!build.startsWith(root + path.sep)) throw new Error('Build must be inside project root');
    await fs.access(safeResourcePath(build, entry));
    const buildTarget = path.join(staging, path.relative(root, build));
    await copyDirectory(build, buildTarget);
    for (const dir of resourceDirs)
      await copyDirectory(path.join(root, dir), path.join(staging, dir));
    for (const file of resourceDocs)
      await fs.copyFile(path.join(root, file), path.join(staging, file));
    const launcher = options.platform === 'windows' ? 'promethee.cmd' : 'promethee';
    const launcherText = await fs.readFile(path.join(root, launcher), 'utf8');
    if (/(?:set\s+(?:"?PATH\s*=)|export\s+PATH\s*=)/i.test(launcherText))
      throw new Error('Launcher must not put private runtime in PATH');
    const expectedEntry = path
      .relative(root, safeResourcePath(build, entry))
      .split(path.sep)
      .join(options.platform === 'windows' ? '\\' : '/');
    const expectedRuntime =
      options.platform === 'windows' ? 'runtime\\node.exe' : 'runtime/bin/node';
    if (!launcherText.includes(expectedEntry) || !launcherText.includes(expectedRuntime))
      throw new Error('Launcher does not reference packaged entry/private runtime');
    await fs.writeFile(path.join(staging, launcher), launcherText);
    await fs.writeFile(
      path.join(staging, 'package.json'),
      JSON.stringify(
        { name: pkg.name, version: pkg.version, private: true, type: 'module' },
        null,
        2,
      ) + '\n',
    );
    const dependencies = await copyProductionDependencies(root, staging, pkg);
    await fs.mkdir(path.dirname(path.join(staging, 'runtime', runtime.relative)), {
      recursive: true,
    });
    await fs.copyFile(runtime.executable, path.join(staging, 'runtime', runtime.relative));
    await fs.copyFile(runtime.license, path.join(staging, 'runtime/LICENSE'));
    const review = path.join(root, 'docs/IMPLEMENTATION-REVIEW.md');
    try {
      await fs.mkdir(path.join(staging, 'docs'), { recursive: true });
      await fs.copyFile(review, path.join(staging, 'docs/IMPLEMENTATION-REVIEW.md'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await fs.writeFile(
      path.join(staging, 'DISTRIBUTION.json'),
      JSON.stringify(
        {
          version: pkg.version,
          kind: 'implementation-preview',
          platform: options.platform,
          architecture: 'x64',
          runtime: {
            version: runtime.version,
            sha256: runtime.sha256,
            execution: runtime.execution,
            archiveSha256: options.runtimeArchiveSha256 ?? null,
            archiveProof,
            private: true,
            inPath: false,
            satisfiesProjectNode: false,
          },
          qualification: {
            resourceIntegrity: 'passed',
            nativeInstallers: 'pending',
            platformExecution: 'see-implementation-review',
            codexBehavior: 'pending',
            ownCodeLicense: 'not-selected-private-distribution',
          },
        },
        null,
        2,
      ) + '\n',
    );
    await fs.copyFile(path.join(root, 'README.md'), path.join(staging, 'README.md'));
    const sums = [];
    for (const relative of await walkFiles(staging))
      sums.push(`${hash(await fs.readFile(safeResourcePath(staging, relative)))}  ${relative}`);
    await fs.writeFile(path.join(staging, 'SHA256SUMS.txt'), sums.join('\n') + '\n');
    await fs.mkdir(outputDir, { recursive: true });
    const packaged = await pythonCall('archive', {
      staging,
      output,
      top,
      platform: options.platform,
      epoch: 1791244800,
    });
    await fs.writeFile(`${output}.sha256`, `${packaged.sha256}  ${path.basename(output)}\n`);
    return {
      output,
      platform: options.platform,
      runtime: runtime.version,
      dependencies,
      ...packaged,
    };
  } finally {
    const resolved = path.resolve(temp);
    if (
      path.dirname(resolved) !== path.resolve(os.tmpdir()) ||
      !path.basename(resolved).startsWith('promethee-package-')
    )
      throw new Error('Unsafe packaging cleanup path');
    await fs.rm(resolved, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = {};
    for (let i = 2; i < process.argv.length; i++) {
      const flag = process.argv[i];
      if (!/^--[a-z][a-z0-9-]*$/.test(flag)) throw new Error(`Invalid packaging flag: ${flag}`);
      const key = flag.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      options[key] = ['development', 'overwrite'].includes(key) ? true : process.argv[++i];
      if (options[key] === undefined) throw new Error(`Missing value: ${flag}`);
    }
    console.log(JSON.stringify(await packageDistribution(options), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
