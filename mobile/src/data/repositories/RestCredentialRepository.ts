import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import {
  mapCredentialOperation,
  mapRealCredentialOperation,
  mapSyntheticArtifact,
} from '@/data/mappers/credentialOperationMapper';
import type { Environment } from '@/domain/model/common';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';

export class RestCredentialRepository implements CredentialRepository {
  constructor(
    private readonly http: FetchHttpClient,
    private readonly getWorkerMode: () => Promise<'fake' | 'real'> = async () => 'real',
  ) {}

  issue(environment: Environment, applicationId: string, key: string) {
    return this.operation(
      `/v2/applications/${encodeURIComponent(applicationId)}/credentials?environment=${environment}`,
      key,
      `/v1/applications/${encodeURIComponent(applicationId)}/credentials?environment=${environment}`,
    );
  }

  regenerate(environment: Environment, applicationId: string, credentialId: string, key: string) {
    return this.operation(
      `/v2/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/regenerations?environment=${environment}`,
      key,
      `/v1/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/regenerations?environment=${environment}`,
    );
  }

  deliver(environment: Environment, applicationId: string, credentialId: string, key: string) {
    return this.getWorkerMode().then((mode) => {
      if (mode === 'fake') {
        return this.requestSynthetic(
          `/v1/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/deliveries?environment=${environment}`,
          key,
        );
      }
      throw new Error('La entrega real solo se prepara al emitir o regenerar la credencial.');
    });
  }

  suspend(
    environment: Environment,
    applicationId: string,
    credentialId: string,
    reason: string,
    key: string,
  ) {
    return this.transition(environment, applicationId, credentialId, 'suspend', reason, key);
  }

  reactivate(
    environment: Environment,
    applicationId: string,
    credentialId: string,
    reason: string,
    key: string,
  ) {
    return this.transition(environment, applicationId, credentialId, 'reactivate', reason, key);
  }

  revoke(
    environment: Environment,
    applicationId: string,
    credentialId: string,
    reason: string,
    key: string,
  ) {
    return this.transition(environment, applicationId, credentialId, 'revoke', reason, key);
  }

  async consumeDelivery(deliveryId: string, code: string) {
    return mapSyntheticArtifact(
      await this.http.request(`/v1/deliveries/${encodeURIComponent(deliveryId)}/artifact`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    );
  }

  async status(operationId: string) {
    if ((await this.getWorkerMode()) === 'fake') {
      throw new Error('Las operaciones fake no requieren reconciliación externa.');
    }
    return mapRealCredentialOperation(
      await this.http.request(`/v2/operations/${encodeURIComponent(operationId)}`, {
        method: 'GET',
        headers: { 'x-keyops-contract-version': '2' },
      }),
    );
  }

  private async operation(realPath: string, key: string, fakePath: string, body?: unknown) {
    if ((await this.getWorkerMode()) === 'fake') return this.requestSynthetic(fakePath, key, body);
    return mapRealCredentialOperation(
      await this.http.request(realPath, {
        method: 'POST',
        headers: {
          'idempotency-key': key,
          'x-keyops-contract-version': '2',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  }

  private async requestSynthetic(path: string, key: string, body?: unknown) {
    return mapCredentialOperation(
      await this.http.request(path, {
        method: 'POST',
        headers: { 'idempotency-key': key },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  }

  private transition(
    environment: Environment,
    applicationId: string,
    credentialId: string,
    action: 'suspend' | 'reactivate' | 'revoke',
    reason: string,
    key: string,
  ) {
    return this.operation(
      `/v2/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/transitions?environment=${environment}`,
      key,
      `/v1/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/transitions?environment=${environment}`,
      { action, reason },
    );
  }
}
