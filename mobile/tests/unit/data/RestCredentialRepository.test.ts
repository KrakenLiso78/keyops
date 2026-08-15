import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { RestCredentialRepository } from '@/data/repositories/RestCredentialRepository';

const receipt = {
  contractVersion: '1' as const,
  operationId: 'operation-1',
  requestId: 'request-1',
  auditEventId: 'audit-1',
  result: 'succeeded' as const,
  delivery: {
    deliveryId: 'delivery-1',
    credentialVersionId: 'version-1',
    deliveryUrl: 'https://keyops.test/v1/deliveries/delivery-1/artifact',
    otp: '123456',
    otpExpiresAt: '2026-08-15T10:02:00.000Z',
    createdAt: '2026-08-15T10:00:00.000Z',
  },
};

describe('RestCredentialRepository', () => {
  it('sends the retained idempotency key and maps the confirmed receipt', async () => {
    const request = jest.fn().mockResolvedValue(receipt);
    const repository = new RestCredentialRepository({ request } as unknown as FetchHttpClient);
    await expect(repository.issue('test', 'app-001', 'keyops-key-00000001')).resolves.toMatchObject(
      {
        operationId: 'operation-1',
        delivery: { otp: '123456' },
      },
    );
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      '/v1/applications/app-001/credentials?environment=test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'idempotency-key': 'keyops-key-00000001' },
      }),
    );
  });

  it('addresses the confirmed credential when regenerating', async () => {
    const request = jest.fn().mockResolvedValue(receipt);
    const repository = new RestCredentialRepository({ request } as unknown as FetchHttpClient);
    await repository.regenerate('production', 'app/001', 'cred/001', 'keyops-key-00000002');
    expect(request).toHaveBeenCalledWith(
      '/v1/applications/app%2F001/credentials/cred%2F001/regenerations?environment=production',
      expect.objectContaining({
        method: 'POST',
        headers: { 'idempotency-key': 'keyops-key-00000002' },
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
        '/v1/applications/app-001/credentials/credential-1/transitions?environment=test',
        expect.objectContaining({
          headers: { 'idempotency-key': 'transition-key-000001' },
          body: JSON.stringify({ action: 'suspend', reason: 'Pausa operativa' }),
        }),
      ],
      [
        '/v1/applications/app-001/credentials/credential-1/transitions?environment=test',
        expect.objectContaining({
          headers: { 'idempotency-key': 'transition-key-000002' },
          body: JSON.stringify({ action: 'reactivate', reason: 'Reanudación autorizada' }),
        }),
      ],
      [
        '/v1/applications/app-001/credentials/credential-1/transitions?environment=test',
        expect.objectContaining({
          headers: { 'idempotency-key': 'transition-key-000003' },
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
    const request = jest.fn().mockResolvedValueOnce(receipt).mockResolvedValueOnce(artifact);
    const repository = new RestCredentialRepository({ request } as unknown as FetchHttpClient);
    await repository.deliver('test', 'app-001', 'credential-1', 'delivery-key-000001');
    await expect(repository.consumeDelivery('delivery/1', '482193')).resolves.toMatchObject({
      classification: 'SYNTHETIC-NON-FUNCTIONAL',
    });
    expect(request.mock.calls).toEqual([
      [
        '/v1/applications/app-001/credentials/credential-1/deliveries?environment=test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'idempotency-key': 'delivery-key-000001' },
        }),
      ],
      [
        '/v1/deliveries/delivery%2F1/artifact',
        { method: 'POST', body: JSON.stringify({ code: '482193' }) },
      ],
    ]);
  });
});
