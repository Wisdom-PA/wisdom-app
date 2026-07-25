import type { CreateProfile, InternetPolicy, ProfileRole } from '../api/types.ts';

/** Internet policies allowed for a role (mirrors cube: child → never only). */
export function allowedInternetPolicies(role: ProfileRole): InternetPolicy[] {
  if (role === 'child') {
    return ['never'];
  }
  return ['never', 'ask_every_time', 'allowed_with_prompt'];
}

export function defaultInternetPolicy(role: ProfileRole): InternetPolicy {
  return role === 'child' ? 'never' : 'ask_every_time';
}

/** Applies child/guest constraints before create/patch (mirrors cube ProfileService). */
export function normalizeCreateProfile(input: CreateProfile): CreateProfile {
  const role = input.role;
  if (role === 'child' && input.internetPolicy !== undefined && input.internetPolicy !== 'never') {
    throw new Error('Child profiles must have internet policy "never"');
  }
  const internetPolicy = role === 'child' ? 'never' : (input.internetPolicy ?? defaultInternetPolicy(role));
  return {
    ...input,
    preferredName: input.preferredName.trim(),
    language: input.language ?? 'en',
    voiceVerbosity: input.voiceVerbosity ?? 'normal',
    internetPolicy,
    linkedAdults: input.linkedAdults ?? [],
  };
}

export function assertInternetPolicyForRole(role: ProfileRole, policy: InternetPolicy): void {
  if (!allowedInternetPolicies(role).includes(policy)) {
    throw new Error(`Internet policy "${policy}" is not allowed for role "${role}"`);
  }
}
