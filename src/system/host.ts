import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runCommand, type CommandRunner } from './commands.js';

export interface HostInspection {
  platform: NodeJS.Platform;
  family: 'windows' | 'ubuntu' | 'unsupported';
  architecture: string;
  version: string;
  supported: boolean;
  wsl: boolean;
  reasons: string[];
  evidence: string[];
}
export interface HostOptions {
  platform?: NodeJS.Platform;
  machine?: string;
  release?: string;
  env?: NodeJS.ProcessEnv;
  now?: Date;
  runner?: CommandRunner;
  readText?: (filename: string) => Promise<string>;
  windowsEdition?: string;
  windowsInstallationType?: string;
}

const windowsEvidence =
  'https://learn.microsoft.com/en-us/windows/release-health/windows11-release-information';
const windowsSupport: Record<number, { general: string; enterprise: string }> = {
  22631: { general: '2025-11-11', enterprise: '2026-11-10' },
  26100: { general: '2026-10-13', enterprise: '2027-10-12' },
  26200: { general: '2027-10-12', enterprise: '2028-10-10' },
  26300: { general: '2028-10-10', enterprise: '2029-10-09' },
  28000: { general: '2028-03-14', enterprise: '2029-03-13' },
};

function parseOsRelease(text: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of text.split(/\r?\n/u)) {
    const match = /^([A-Z_]+)=(.*)$/u.exec(line);
    if (match) values[match[1]!] = match[2]!.replace(/^(["'])(.*)\1$/u, '$2');
  }
  return values;
}

async function registryValue(name: string, options: HostOptions): Promise<string | undefined> {
  const env = options.env ?? process.env;
  const result = await (options.runner ?? runCommand)({
    command: path.win32.join(env.SystemRoot ?? 'C:\\Windows', 'System32', 'reg.exe'),
    args: ['query', 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', '/v', name],
    timeoutMs: 10_000,
  });
  if (result.code !== 0 || result.error) return undefined;
  return /REG_SZ\s+([^\r\n]+)/u.exec(result.stdout)?.[1]?.trim();
}

export async function inspectHost(options: HostOptions = {}): Promise<HostInspection> {
  const platform = options.platform ?? process.platform;
  const machine = (options.machine ?? os.machine()).toLowerCase();
  const architecture = ['x86_64', 'amd64', 'x64'].includes(machine) ? 'x64' : machine;
  const release = options.release ?? os.release();
  const env = options.env ?? process.env;
  const result: HostInspection = {
    platform,
    family: 'unsupported',
    architecture,
    version: release,
    supported: false,
    wsl: false,
    reasons: [],
    evidence: [],
  };
  if (architecture !== 'x64')
    result.reasons.push(`Architecture ${architecture} hors périmètre : x64 requis.`);
  if (platform === 'win32') {
    result.family = 'windows';
    result.evidence.push(
      windowsEvidence,
      'Table de support contrôlée le 2026-10-06; éditions et date courante vérifiées localement.',
    );
    const edition = options.windowsEdition ?? (await registryValue('EditionID', options));
    const installation =
      options.windowsInstallationType ?? (await registryValue('InstallationType', options));
    const build = Number(release.split('.')[2]);
    const support = windowsSupport[build];
    result.version = `Windows ${release}${edition ? ` (${edition})` : ''}`;
    if (installation !== 'Client' || !edition) {
      result.reasons.push(
        'Édition Windows cliente impossible à confirmer ; Windows Server est hors périmètre.',
      );
    } else if (!support) {
      result.reasons.push(
        'Version/build Windows 11 non qualifié ou non maintenu dans ce catalogue.',
      );
    } else {
      const enterprise = /^(Enterprise|Education|IoTEnterprise)/u.test(edition);
      const end =
        build === 26100 && /^(EnterpriseS|IoTEnterpriseS)/u.test(edition)
          ? edition.startsWith('IoT')
            ? '2034-10-10'
            : '2029-10-09'
          : support[enterprise ? 'enterprise' : 'general'];
      const expiry = new Date(`${end}T23:59:59.999Z`);
      if ((options.now ?? new Date()) > expiry)
        result.reasons.push(`Windows n'est plus maintenu pour cette édition (fin : ${end}).`);
    }
  } else if (platform === 'linux') {
    try {
      const info = parseOsRelease(
        await (options.readText ?? ((file) => readFile(file, 'utf8')))('/etc/os-release'),
      );
      result.version = info.PRETTY_NAME ?? `${info.ID} ${info.VERSION_ID}`;
      result.wsl = Boolean(env.WSL_DISTRO_NAME || env.WSL_INTEROP || /microsoft/iu.test(release));
      if (info.ID === 'ubuntu' && info.VERSION_ID === '24.04') {
        result.family = 'ubuntu';
        result.evidence.push('/etc/os-release: ID=ubuntu, VERSION_ID=24.04');
      } else
        result.reasons.push(
          'Ubuntu 24.04 LTS requis ; cette distribution/version est hors périmètre.',
        );
    } catch (error) {
      result.reasons.push(`Distribution impossible à identifier : ${(error as Error).message}`);
    }
  } else result.reasons.push('Hôte pris en charge : Windows 11 ou Ubuntu 24.04 LTS.');
  result.supported = result.family !== 'unsupported' && result.reasons.length === 0;
  return result;
}
