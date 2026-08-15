import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import {
  mapRealCredentialOperation,
  mapSyntheticArtifact,
} from '@/data/mappers/credentialOperationMapper';
import type { Environment } from '@/domain/model/common';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';

export class RestCredentialRepository implements CredentialRepository {
  constructor(private readonly http: FetchHttpClient) {}

  issue(environment: Environment, applicationId: string, key: string) {
    return this.realOperation(
      `/v2/applications/${encodeURIComponent(applicationId)}/credentials?environment=${environment}`,
      key,
    );
  }

  regenerate(environment: Environment, applicationId: string, credentialId: string, key: string) {
    return this.realOperation(
      `/v2/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/regenerations?environment=${environment}`,
      key,
    );
  }

  deliver(environment: Environment, applicationId: string, credentialId: string, key: string) {
    void environment;
    void applicationId;
    void credentialId;
    void key;
    return Promise.reject(
      new Error('La entrega real solo se prepara al emitir o regenerar la credencial.'),
    );
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
    return mapRealCredentialOperation(
      await this.http.request(`/v2/operations/${encodeURIComponent(operationId)}`, {
        method: 'GET',
        headers: { 'x-keyops-contract-version': '2' },
      }),
    );
  }

  private async realOperation(path: string, key: string, body?: unknown) {
    return mapRealCredentialOperation(
      await this.http.request(path, {
        method: 'POST',
        headers: {
          'idempotency-key': key,
          'x-keyops-contract-version': '2',
        },
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
    return this.realOperation(
      `/v2/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/transitions?environment=${environment}`,
      key,
      { action, reason },
    );
  }
}
