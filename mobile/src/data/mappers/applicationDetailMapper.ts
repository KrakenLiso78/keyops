import type { z } from 'zod';
import type { Application, CredentialHistoryEntry, CredentialState } from '@/domain/model/types';
import {
  apiApplicationSchema,
  applicationDetailResponseSchema,
} from '@/data/schemas/applicationDetail';

type ApiApplication = z.infer<typeof apiApplicationSchema>;

const states = new Set<CredentialState>([
  'no_credentials',
  'active',
  'suspended',
  'rotated_inactive',
  'revoked',
]);

export function mapApiApplication(input: ApiApplication): Application {
  const credentialHistory = input.stateHistory.flatMap((entry): CredentialHistoryEntry[] => {
    const state = entry.state ?? entry.toState;
    const changedAt = entry.changedAt;
    if (typeof state !== 'string' || !states.has(state as CredentialState)) return [];
    if (typeof changedAt !== 'string' || Number.isNaN(Date.parse(changedAt))) return [];
    return [
      {
        state: state as CredentialState,
        changedAt,
        actorDisplayName:
          typeof entry.actorDisplayName === 'string' ? entry.actorDisplayName : undefined,
      },
    ];
  });
  return {
    id: input.id,
    name: input.name,
    institution: input.institution.name,
    environment: input.environment,
    apiRole: input.apiRole.name,
    declaredIps: input.declaredIps,
    technicalContact: input.management.technicalContact?.name,
    technicalContactEmail: input.management.technicalContact?.email,
    technicalContactPhone: input.management.technicalContact?.phone,
    managementReason: input.management.reason,
    requestOrTicketId: input.management.requestOrTicketId,
    credentialState: input.credentialState,
    clientId: input.clientId,
    lastChangedAt: input.lastChangedAt,
    updatedAt: input.updatedAt,
    credentialHistory,
  };
}

export function mapApplicationDetail(input: unknown): Application {
  const parsed = applicationDetailResponseSchema.parse(input);
  return mapApiApplication(parsed.application);
}
