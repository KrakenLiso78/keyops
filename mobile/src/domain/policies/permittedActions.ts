import type { CredentialState, UserProfile } from '@/domain/model/types';

export type CredentialAction =
  'issue' | 'regenerate' | 'suspend' | 'reactivate' | 'revoke' | 'delivery';

export function permittedActions(profile: UserProfile, state: CredentialState): CredentialAction[] {
  if (profile === 'auditor') return [];
  const actions: CredentialAction[] = [];
  if (state === 'no_credentials') actions.push('issue');
  if (state === 'active') actions.push('regenerate', 'suspend', 'delivery');
  if (state === 'suspended') actions.push('reactivate');
  if (profile === 'senior_analyst' || profile === 'administrator') {
    if (state === 'active' || state === 'suspended') actions.push('revoke');
  }
  return actions;
}

export const canReadAudit = (profile: UserProfile) => profile !== 'analyst';
export const canManageUsers = (profile: UserProfile) => profile === 'administrator';
