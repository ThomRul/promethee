import type {
  CatalogueResources,
  OptionRule,
  OptionValue,
  Profile,
  Skill,
  SkillRouting,
} from './catalogue.js';

export interface SelectionInput {
  profile: string;
  options?: Record<string, OptionValue>;
  skillIds?: string[];
  scope?: 'defined' | 'undefined';
  git?: boolean;
}
export interface Selection {
  profile: Profile;
  options: Record<string, OptionValue>;
  skills: Skill[];
  scope: 'defined' | 'undefined';
  git: boolean;
  activeRules: OptionRule[];
  qualificationBlockers: string[];
}

export function conditionMatches(
  options: Record<string, OptionValue>,
  conditions?: Record<string, OptionValue | string[]>,
): boolean {
  return (
    !conditions ||
    Object.entries(conditions).every(([key, value]) =>
      Array.isArray(value) ? value.includes(String(options[key])) : options[key] === value,
    )
  );
}

export function ruleActive(rule: OptionRule, options: Record<string, OptionValue>): boolean {
  if (!conditionMatches(options, rule.when)) return false;
  if (rule.choices)
    return rule.manifestOption !== undefined && options[rule.manifestOption] !== undefined;
  switch (rule.id) {
    case 'database-mariadb':
      return options.database === 'mariadb';
    case 'desktop-sqlite':
    case 'mobile-sqlite':
      return options.database === 'sqlite';
    case 'backend-new':
      return options.backend === 'new';
    case 'backend-existing':
      return options.backend === 'existing';
    default:
      return options[rule.manifestOption ?? rule.id] === true;
  }
}

export function relevantRouting(
  resources: CatalogueResources,
  selection: Selection,
): SkillRouting[] {
  return resources.routing.filter(
    (route) =>
      selection.skills.some((skill) => skill.id === route.id) &&
      route.profiles.includes(selection.profile.id) &&
      conditionMatches(selection.options, route.when),
  );
}

export function availableSkills(
  resources: CatalogueResources,
  profileId: string,
  options: Record<string, OptionValue>,
): Skill[] {
  return resources.skills.filter(
    (skill) =>
      skill.profiles.includes(profileId) &&
      skill.status === 'adapted-static-qualified' &&
      !skill.paidDependencyRequired &&
      ['MIT', 'Apache-2.0'].includes(skill.license) &&
      resources.routing.some(
        (route) =>
          route.id === skill.id &&
          route.profiles.includes(profileId) &&
          conditionMatches(options, route.when),
      ) &&
      (skill.id !== 'supabase-postgres-best-practices' ||
        profileId !== 'mobile' ||
        options.backend === 'new'),
  );
}

export function resolveSelection(resources: CatalogueResources, input: SelectionInput): Selection {
  const profile = resources.profiles.find((candidate) => candidate.id === input.profile);
  if (!profile) throw new Error(`Profil inconnu : ${input.profile}`);
  if (input.scope !== undefined && !['defined', 'undefined'].includes(input.scope))
    throw new Error('Périmètre invalide.');
  if (input.git !== undefined && typeof input.git !== 'boolean')
    throw new Error('Choix Git invalide.');
  const options = { ...profile.defaults, ...input.options };
  const allowed = new Set(Object.keys(profile.defaults));
  for (const key of Object.keys(options))
    if (!allowed.has(key)) throw new Error(`Option incompatible avec ${profile.id} : ${key}`);
  for (const key of ['uiAnimations', 'editorialAnimations', 'livewire']) {
    if (key in options && typeof options[key] !== 'boolean')
      throw new Error(`Option booléenne attendue : ${key}`);
  }
  const databases: Record<string, string[]> = {
    'web-api': ['postgresql'],
    php: ['mysql', 'mariadb'],
    desktop: ['none', 'sqlite'],
    mobile: ['none', 'sqlite'],
  };
  if (!databases[profile.id]?.includes(String(options.database)))
    throw new Error('Base incompatible avec le profil.');
  if (profile.id === 'mobile') {
    if (!['none', 'existing', 'new'].includes(String(options.backend)))
      throw new Error('Backend mobile invalide.');
    if (!['android-local', 'expo-go'].includes(String(options.mobileMode)))
      throw new Error('Parcours mobile invalide.');
    if (options.mobileMode === 'expo-go') delete options.androidTarget;
    else if (!['device', 'emulator'].includes(String(options.androidTarget)))
      throw new Error('Cible Android invalide.');
  }
  const activeRules = resources.optionRules.filter(
    (rule) => rule.profiles.includes(profile.id) && ruleActive(rule, options),
  );
  const defaults = new Set(profile.skillSelection.defaults);
  for (const rule of activeRules) {
    for (const id of [...(rule.additionalSkills ?? []), ...(rule.suggestedSkills ?? [])])
      defaults.add(id);
    if (rule.skill && rule.skillStatus !== 'blocked-redistribution') defaults.add(rule.skill);
  }
  const requested = input.skillIds ?? [...defaults];
  if (
    !Array.isArray(requested) ||
    requested.some((id) => typeof id !== 'string') ||
    new Set(requested).size !== requested.length
  ) {
    throw new Error('La sélection des skills doit contenir des identifiants uniques.');
  }
  const allowedSkills = availableSkills(resources, profile.id, options);
  const skills = requested.map((id) => {
    const skill = allowedSkills.find((candidate) => candidate.id === id);
    if (!skill) throw new Error(`Skill indisponible ou incompatible avec les options : ${id}`);
    return skill;
  });
  const qualificationBlockers = activeRules
    .filter((rule) => rule.qualification?.startsWith('pending'))
    .map((rule) => `${rule.id} : ${rule.qualification}`)
    .filter(
      (message) => !(options.mobileMode === 'expo-go' && message.startsWith('mobile-mode :')),
    );
  return {
    profile,
    options,
    skills,
    scope: input.scope ?? 'undefined',
    git: input.git ?? true,
    activeRules,
    qualificationBlockers,
  };
}

export function assertInstallable(selection: Selection): void {
  if (selection.qualificationBlockers.length) {
    throw new Error(
      `Installation bloquée : qualification manquante (${selection.qualificationBlockers.join('; ')}). Un aperçu documentaire reste possible.`,
    );
  }
}
