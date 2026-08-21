import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { RestCredentialRepository } from '@/data/repositories/RestCredentialRepository';

const receipt = {
  contractVersion: '2' as const,
  operationId: 'operation-1',
  requestId: 'request-1',
  auditEventId: 'audit-1',
  result: 'succeeded' as const,
  status: 'confirmed' as const,
  delivery: {
    deliveryId: 'delivery-1',
    expiresAt: '2026-08-15T10:02:00.000Z',
  },
};

describe('RestCredentialRepository', () => {
  it('sends the retained idempotency key and maps the confirmed receipt', async () => {
    const request = jest.fn().mockResolvedValue(receipt);
    const repository = new RestCredentialRepository({ request } as unknown as FetchHttpClient);
    await expect(repository.issue('test', 'app-001', 'keyops-key-00000001')).resolves.toMatchObject(
      {
        operationId: 'operation-1',
        status: 'confirmed',
        delivery: { deliveryId: 'delivery-1' },
      },
    );
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      '/v2/applications/app-001/credentials?environment=test',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'idempotency-key': 'keyops-key-00000001',
          'x-keyops-contract-version': '2',
        },
      }),
    );
  });

  it('addresses the confirmed credential when regenerating', async () => {
    const request = jest.fn().mockResolvedValue(receipt);
    const repository = new RestCredentialRepository({ request } as unknown as FetchHttpClient);
    await repository.regenerate('production', 'app/001', 'cred/001', 'keyops-key-00000002');
    expect(request).toHaveBeenCalledWith(
      '/v2/applications/app%2F001/credentials/cred%2F001/regenerations?environment=production',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'idempotency-key': 'keyops-key-00000002',
          'x-keyops-contract-version': '2',
        },
      }),
    );
  });

  it('sends transition commands without changing their retained key', async () => {
    const request = jest.fn().mockResolvedValue({ ...receipt, delivery: undefined });
    const repository = new RestCredentialRepository({ request } as unknown as FetchHttpClient);
    await repository.suspend(
      'test',
      'app-001',
      'credential-1',
      'Pausa operativa',
      'transition-key-000001',
    );
    await repository.reactivate(
      'test',
      'app-001',
      'credential-1',
      'Reanudación autorizada',
      'transition-key-000002',
    );
    await repository.revoke(
      'test',
      'app-001',
      'credential-1',
      'Baja definitiva',
      'transition-key-000003',
    );
    expect(request.mock.calls).toEqual([
      [
        '/v2/applications/app-001/credentials/credential-1/transitions?environment=test',
        expect.objectContaining({
          headers: {
            'idempotency-key': 'transition-key-000001',
            'x-keyops-contract-version': '2',
          },
          body: JSON.stringify({ action: 'suspend', reason: 'Pausa operativa' }),
        }),
      ],
      [
        '/v2/applications/app-001/credentials/credential-1/transitions?environment=test',
        expect.objectContaining({
          headers: {
            'idempotency-key': 'transition-key-000002',
            'x-keyops-contract-version': '2',
          },
          body: JSON.stringify({ action: 'reactivate', reason: 'Reanudación autorizada' }),
        }),
      ],
      [
        '/v2/applications/app-001/credentials/credential-1/transitions?environment=test',
        expect.objectContaining({
          headers: {
            'idempotency-key': 'transition-key-000003',
            'x-keyops-contract-version': '2',
          },
          body: JSON.stringify({ action: 'revoke', reason: 'Baja definitiva' }),
        }),
      ],
    ]);
  });

  it('creates and explicitly consumes a synthetic delivery', async () => {
    const artifact = {
      contractVersion: '1',
      classification: 'SYNTHETIC-NON-FUNCTIONAL',
      applicationId: 'app-001',
      credentialVersionId: 'version-1',
      generatedAt: '2026-08-15T10:01:00.000Z',
    };
    const request = jest.fn().mockResolvedValueOnce(artifact);
    const repository = new RestCredentialRepository({ request } as unknown as FetchHttpClient);
    await expect(
      repository.deliver('test', 'app-001', 'credential-1', 'delivery-key-000001'),
    ).rejects.toThrow('solo se prepara');
    await expect(repository.consumeDelivery('delivery/1', '482193')).resolves.toMatchObject({
      classification: 'SYNTHETIC-NON-FUNCTIONAL',
    });
    expect(request.mock.calls).toEqual([
      [
        '/v1/deliveries/delivery%2F1/artifact',
        { method: 'POST', body: JSON.stringify({ code: '482193' }) },
      ],
    ]);
  });

  it('reconciles a v2 operation by its opaque identifier', async () => {
    const request = jest.fn().mockResolvedValue(receipt);
    const repository = new RestCredentialRepository({ request } as unknown as FetchHttpClient);

    await repository.status('operation/1');

    expect(request).toHaveBeenCalledWith('/v2/operations/operation%2F1', {
      method: 'GET',
      headers: { 'x-keyops-contract-version': '2' },
    });
  });

  it('uses the v1 synthetic routes when the Worker is in fake mode', async () => {
    const syntheticReceipt = {
      contractVersion: '1',
      operationId: 'operation-fake',
      requestId: 'request-fake',
      result: 'succeeded',
    };
    const request = jest.fn().mockResolvedValue(syntheticReceipt);
    const repository = new RestCredentialRepository(
      { request } as unknown as FetchHttpClient,
      async () => 'fake',
    );
    await repository.issue('test', 'app-001', 'fake-key-000001');
    expect(request).toHaveBeenCalledWith(
      '/v1/applications/app-001/credentials?environment=test',
      expect.objectContaining({ headers: { 'idempotency-key': 'fake-key-000001' } }),
    );
  });
});
