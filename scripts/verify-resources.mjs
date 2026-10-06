import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const shaPattern = /^[a-f0-9]{64}$/;
const idPattern = /^[a-z0-9][a-z0-9-]*$/;
const profileIds = ['web-api', 'php', 'desktop', 'mobile'];

export function safeResourcePath(root, relative) {
  if (
    typeof relative !== 'string' ||
    !relative ||
    /[\\\x00-\x1f\x7f]/u.test(relative) ||
    path.posix.isAbsolute(relative) ||
    /^[A-Za-z]:/.test(relative) ||
    relative.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error(`Unsafe resource path: ${JSON.stringify(relative)}`);
  }
  return path.join(root, ...relative.split('/'));
}

export async function walkFiles(root) {
  const files = [];
  async function visit(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const stat = await fs.lstat(full);
      if (stat.isSymbolicLink()) throw new Error(`Symbolic link not permitted: ${full}`);
      if (stat.isDirectory()) await visit(full);
      else if (stat.isFile()) files.push(path.relative(root, full).split(path.sep).join('/'));
      else throw new Error(`Special file not permitted: ${full}`);
    }
  }
  if ((await fs.lstat(root)).isSymbolicLink())
    throw new Error(`Symbolic link not permitted: ${root}`);
  await visit(root);
  return files.sort();
}

export async function verifyResources(resourceRoot, { validateExamples = true } = {}) {
  const root = path.resolve(resourceRoot);
  const errors = [];
  const warnings = [];
  let adapted = 0;
  let blocked = 0;
  let checkedFiles = 0;
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };
  const readJson = async (relative) =>
    JSON.parse(await fs.readFile(safeResourcePath(root, relative), 'utf8'));
  const exists = async (full) => {
    try {
      await fs.lstat(full);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  };
  try {
    const lock = await readJson('catalogue/skills.lock.json');
    check(
      lock.schemaVersion === 1 && Array.isArray(lock.entries),
      'Unsupported skills lock schema',
    );
    if (!Array.isArray(lock.entries)) throw new Error('Skills entries must be an array');
    const entries = new Map();
    for (const entry of lock.entries) {
      check(idPattern.test(entry.id), `Invalid skill id: ${entry.id}`);
      check(!entries.has(entry.id), `Duplicate skill id: ${entry.id}`);
      entries.set(entry.id, entry);
      const dir = safeResourcePath(root, `catalogue/skills/${entry.id}`);
      check(/^[a-f0-9]{40}$/.test(entry.revision), `${entry.id}: unpinned revision`);
      if (entry.status !== 'adapted-static-qualified') {
        blocked++;
        check(!(await exists(dir)), `${entry.id}: unqualified skill must not be copied`);
        check(!entry.files?.length, `${entry.id}: unqualified skill has distributable files`);
        continue;
      }
      adapted++;
      check(['MIT', 'Apache-2.0'].includes(entry.license), `${entry.id}: unsupported licence`);
      check(
        entry.paidDependencyRequired === false,
        `${entry.id}: paid dependency policy not satisfied`,
      );
      check(
        Number.isInteger(entry.adaptationVersion) && entry.adaptationVersion >= 1,
        `${entry.id}: missing adaptation version`,
      );
      if (!(await exists(dir))) {
        errors.push(`${entry.id}: missing prepared skill directory`);
        continue;
      }
      const actual = await walkFiles(dir);
      const declared = entry.files ?? [];
      check(declared.length > 0, `${entry.id}: empty baseline`);
      const names = declared.map((file) => file.path);
      check(new Set(names).size === names.length, `${entry.id}: duplicate baseline paths`);
      check(
        JSON.stringify(actual) === JSON.stringify([...names].sort()),
        `${entry.id}: missing or unexpected files`,
      );
      for (const file of declared) {
        const full = safeResourcePath(dir, file.path);
        check(shaPattern.test(file.sha256), `${entry.id}/${file.path}: invalid hash`);
        if (!(await exists(full))) continue;
        const stat = await fs.lstat(full);
        if (!stat.isFile() || stat.isSymbolicLink()) {
          errors.push(`${entry.id}/${file.path}: not a regular file`);
          continue;
        }
        const bytes = await fs.readFile(full);
        checkedFiles++;
        check(file.bytes === bytes.length, `${entry.id}/${file.path}: byte length mismatch`);
        check(file.sha256 === sha256(bytes), `${entry.id}/${file.path}: hash mismatch`);
      }
      const sorted = [...declared].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
      check(
        entry.adaptedTreeSha256 ===
          sha256(sorted.map((file) => `${file.path}\0${file.sha256}`).join('\n')),
        `${entry.id}: tree hash mismatch`,
      );
      const skillFile = declared.find((file) => file.path === 'SKILL.md');
      check(
        skillFile && skillFile.sha256 === entry.adaptedEntrySha256,
        `${entry.id}: entry hash mismatch`,
      );
      const licence = actual.filter((file) => /^LICENSE(?:\.[^/]+)?$/u.test(file));
      check(licence.length > 0, `${entry.id}: missing complete licence`);
      if (licence.length) {
        const text = (
          await Promise.all(licence.map((file) => fs.readFile(safeResourcePath(dir, file), 'utf8')))
        ).join('\n');
        check(
          entry.license === 'MIT'
            ? /Permission is hereby granted/i.test(text) && /THE SOFTWARE IS PROVIDED/i.test(text)
            : /Apache License/.test(text) &&
                /Version 2\.0/.test(text) &&
                /END OF TERMS AND CONDITIONS/.test(text),
          `${entry.id}: incomplete licence text`,
        );
      }
      check(actual.includes('NOTICE.promethee'), `${entry.id}: missing modification notice`);
      check(actual.includes('PROMETHEE-SOURCE.json'), `${entry.id}: missing provenance`);
      if (actual.includes('NOTICE.promethee')) {
        const text = await fs.readFile(path.join(dir, 'NOTICE.promethee'), 'utf8');
        check(
          text.includes(entry.revision) && text.includes(entry.upstreamUrl),
          `${entry.id}: notice provenance mismatch`,
        );
      }
      if (actual.includes('PROMETHEE-SOURCE.json')) {
        const source = JSON.parse(
          await fs.readFile(path.join(dir, 'PROMETHEE-SOURCE.json'), 'utf8'),
        );
        for (const [key, expected] of Object.entries({
          id: entry.id,
          repository: entry.repo,
          revision: entry.revision,
          source: entry.source,
          upstreamUrl: entry.upstreamUrl,
          license: entry.license,
          adaptationVersion: entry.adaptationVersion,
        })) {
          check(source[key] === expected, `${entry.id}: provenance ${key} mismatch`);
        }
      }
      if (entry.id === 'impeccable')
        check(actual.includes('NOTICE.md'), 'impeccable: upstream Apache notice missing');
      if (skillFile && actual.includes('SKILL.md')) {
        const text = await fs.readFile(path.join(dir, 'SKILL.md'), 'utf8');
        const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text)?.[1] ?? '';
        check(
          /^name:\s*\S+/mu.test(frontmatter) && /^description:\s*\S+/mu.test(frontmatter),
          `${entry.id}: invalid skill frontmatter`,
        );
      }
    }
    for (const dir of await fs.readdir(path.join(root, 'catalogue/skills'), {
      withFileTypes: true,
    })) {
      check(
        dir.isDirectory() && !dir.isSymbolicLink() && entries.has(dir.name),
        `Unexpected skill directory: ${dir.name}`,
      );
    }
    const routing = await readJson('catalogue/skill-routing.json');
    check(Array.isArray(routing.entries), 'Skill routing entries must be an array');
    const routeIds = new Set();
    for (const route of routing.entries ?? []) {
      check(!routeIds.has(route.id), `Duplicate skill route: ${route.id}`);
      routeIds.add(route.id);
      const entry = entries.get(route.id);
      check(
        entry?.status === 'adapted-static-qualified',
        `Route for absent or unqualified skill: ${route.id}`,
      );
      check(
        route.trigger?.length > 0 && route.limit?.length > 0,
        `${route.id}: missing routing scope`,
      );
      check(
        route.profiles.every(
          (profile) => profileIds.includes(profile) && entry?.profiles.includes(profile),
        ),
        `${route.id}: unsupported routing profile`,
      );
    }
    for (const entry of entries.values()) {
      if (entry.status === 'adapted-static-qualified')
        check(routeIds.has(entry.id), `${entry.id}: prepared skill lacks routing`);
    }
    const config = await readJson('templates/profiles.json');
    const foundProfiles = new Set();
    for (const profile of config.profiles ?? []) {
      check(
        profileIds.includes(profile.id) && !foundProfiles.has(profile.id),
        `Invalid or duplicate profile: ${profile.id}`,
      );
      foundProfiles.add(profile.id);
      const selections = profile.skillSelection;
      const selectable = [
        ...(profile.skills ?? []),
        ...(selections?.defaults ?? []),
        ...(selections?.optional ?? []),
        ...Object.values(selections?.optionSuggestedSkills ?? {}).flat(),
      ];
      for (const id of selectable)
        check(
          entries.get(id)?.status === 'adapted-static-qualified' && routeIds.has(id),
          `${profile.id}: selected skill not prepared/routed: ${id}`,
        );
      check(
        await exists(safeResourcePath(path.join(root, 'templates'), profile.template)),
        `${profile.id}: missing template`,
      );
    }
    check(foundProfiles.size === profileIds.length, 'Missing profile');
    const frameworks = await readJson('catalogue/frameworks.lock.json');
    check(
      Array.isArray(frameworks.packages) && frameworks.packages.length > 0,
      'Missing pinned framework package catalogue',
    );
    for (const entry of frameworks.packages ?? []) {
      check(
        typeof entry.version === 'string' && /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(entry.version),
        `${entry.name}: package version not pinned`,
      );
      check(
        /^sha(?:256|384|512)-/.test(entry.integrity),
        `${entry.name}: package integrity missing`,
      );
      check(
        /^https:\/\/registry\.npmjs\.org\//.test(entry.tarball),
        `${entry.name}: unsupported registry tarball`,
      );
    }
    for (const relative of ['catalogue', 'templates', 'branding']) {
      for (const file of await walkFiles(path.join(root, relative)))
        if (file.endsWith('.json')) await readJson(`${relative}/${file}`);
    }
    if (validateExamples) {
      const { default: Ajv } = await import('ajv');
      const { default: addFormats } = await import('ajv-formats');
      const ajv = new Ajv({ strict: false, allErrors: true });
      addFormats(ajv);
      const validate = ajv.compile(await readJson('templates/manifest.schema.json'));
      if (await exists(path.join(root, 'examples'))) {
        for (const file of await walkFiles(path.join(root, 'examples'))) {
          if (!file.endsWith('/manifest.example.json')) continue;
          check(
            validate(await readJson(`examples/${file}`)),
            `${file}: invalid example manifest (${ajv.errorsText(validate.errors)})`,
          );
        }
      }
      for (const file of ['local-tools.schema.json', 'local-services.schema.json'])
        ajv.compile(await readJson(`templates/${file}`));
    }
    warnings.push(
      'Static resources do not prove Codex behavior, native installers, database services, or device builds.',
    );
    warnings.push(
      ...(config.optionRules ?? [])
        .filter((rule) => rule.qualification?.startsWith('pending'))
        .map((rule) => `${rule.id}: ${rule.qualification}`),
    );
  } catch (error) {
    errors.push(error.message);
  }
  return {
    passed: errors.length === 0,
    adaptedSkills: adapted,
    blockedSkills: blocked,
    checkedFiles,
    errors: errors.sort(),
    warnings: warnings.sort(),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const report = await verifyResources(root);
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}
