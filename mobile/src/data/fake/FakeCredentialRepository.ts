import { fakeRepository } from './FakeKeyOpsRepository';
import type { Receipt, User } from '@/domain/model/types';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';
import type { OperationReceipt } from '@/domain/model/audit';
export class FakeCredentialRepository {
  constructor(private readonly user: User) {}
  issue(environment: 'test' | 'production', applicationId: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'issue');
  }
  regenerate(environment: 'test' | 'production', applicationId: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'regenerate');
  }
  deliver(environment: 'test' | 'production', applicationId: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'delivery');
  }
  suspend(environment: 'test' | 'production', applicationId: string, reason: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'suspend', reason);
  }
  reactivate(environment: 'test' | 'production', applicationId: string, reason: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'reactivate', reason);
  }
  revoke(environment: 'test' | 'production', applicationId: string, reason: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'revoke', reason);
  }
  async consumeDelivery(deliveryId: string, code: string) {
    if (!deliveryId || !code) throw new Error('La entrega sintética no es válida.');
    return {
      classification: 'SYNTHETIC-NON-FUNCTIONAL' as const,
      applicationId: 'fake-application',
      credentialVersionId: 'fake-version',
      generatedAt: new Date().toISOString(),
    };
  }
}

export function createFakeCredentialRepository(user: User): CredentialRepository {
  const legacy = new FakeCredentialRepository(user);
  const adapt = (receipt: Receipt): OperationReceipt => ({
    ...receipt,
    delivery: receipt.delivery
      ? {
          ...receipt.delivery,
          deliveryId: `fake-delivery-${receipt.operationId}`,
          credentialVersionId: `fake-version-${receipt.operationId}`,
          createdAt: new Date(Date.parse(receipt.delivery.otpExpiresAt) - 120_000).toISOString(),
        }
      : undefined,
  });
  return {
    issue: async (environment, applicationId) => adapt(legacy.issue(environment, applicationId)),
    regenerate: async (environment, applicationId) =>
      adapt(legacy.regenerate(environment, applicationId)),
    deliver: async (environment, applicationId) =>
      adapt(legacy.deliver(environment, applicationId)),
    suspend: async (environment, applicationId, _credentialId, reason) =>
      adapt(legacy.suspend(environment, applicationId, reason)),
    reactivate: async (environment, applicationId, _credentialId, reason) =>
      adapt(legacy.reactivate(environment, applicationId, reason)),
    revoke: async (environment, applicationId, _credentialId, reason) =>
      adapt(legacy.revoke(environment, applicationId, reason)),
    consumeDelivery: (deliveryId, code) => legacy.consumeDelivery(deliveryId, code),
  };
}
