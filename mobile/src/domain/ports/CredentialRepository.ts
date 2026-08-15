import type { Environment } from '@/domain/model/common';
import type { OperationReceipt } from '@/domain/model/audit';
import type { SyntheticArtifact } from '@/domain/model/delivery';

export interface CredentialRepository {
  issue(environment: Environment, applicationId: string, key: string): Promise<OperationReceipt>;
  regenerate(
    environment: Environment,
    applicationId: string,
    credentialId: string,
    key: string,
  ): Promise<OperationReceipt>;
  deliver(
    environment: Environment,
    applicationId: string,
    credentialId: string,
    key: string,
  ): Promise<OperationReceipt>;
  suspend(
    environment: Environment,
    applicationId: string,
    credentialId: string,
    reason: string,
    key: string,
  ): Promise<OperationReceipt>;
  reactivate(
    environment: Environment,
    applicationId: string,
    credentialId: string,
    reason: string,
    key: string,
  ): Promise<OperationReceipt>;
  revoke(
    environment: Environment,
    applicationId: string,
    credentialId: string,
    reason: string,
    key: string,
  ): Promise<OperationReceipt>;
  consumeDelivery(deliveryId: string, code: string): Promise<SyntheticArtifact>;
  status(operationId: string): Promise<OperationReceipt>;
}
