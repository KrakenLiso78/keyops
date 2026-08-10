import type { CredentialState } from '@/domain/model/types';

export function nextCredentialState(action: string, current: CredentialState): CredentialState {
  const transitions: Record<string, Partial<Record<CredentialState, CredentialState>>> = {
    issue: { no_credentials: 'active' },
    regenerate: { active: 'active' },
    suspend: { active: 'suspended' },
    reactivate: { suspended: 'active' },
    revoke: { active: 'revoked', suspended: 'revoked' },
  };
  const next = transitions[action]?.[current];
  if (!next) throw new Error('La transición solicitada no está permitida.');
  return next;
}

export const actionNeedsReason = (action: string) =>
  ['suspend', 'reactivate', 'revoke'].includes(action);
