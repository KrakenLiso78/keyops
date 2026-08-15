import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import {
  mapCredentialOperation,
  mapSyntheticArtifact,
} from '@/data/mappers/credentialOperationMapper';
import type { Environment } from '@/domain/model/common';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';

export class RestCredentialRepository implements CredentialRepository {
  constructor(private readonly http: FetchHttpClient) {}

  issue(environment: Environment, applicationId: string, key: string) {
    return this.operation(
      `/v1/applications/${encodeURIComponent(applicationId)}/credentials?environment=${environment}`,
      key,
    );
  }

  regenerate(environment: Environment, applicationId: string, credentialId: string, key: string) {
    return this.operation(
      `/v1/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/regenerations?environment=${environment}`,
      key,
    );
  }

  deliver(environment: Environment, applicationId: string, credentialId: string, key: string) {
    return this.operation(
      `/v1/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/deliveries?environment=${environment}`,
      key,
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

  private async operation(path: string, key: string, body?: unknown) {
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
      `/v1/applications/${encodeURIComponent(applicationId)}/credentials/${encodeURIComponent(credentialId)}/transitions?environment=${environment}`,
      key,
      { action, reason },
    );
  }
}
